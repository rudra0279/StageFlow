import { Session } from '../models/Session.js';
import { Event } from '../models/Event.js';
import { SESSION_STATUS } from '../constants/eventStatus.js';
import { socketService } from './socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const createSession = async (eventId, sessionData) => {
  const existingCount = await Session.countDocuments({ eventId });
  const orderIndex = sessionData.orderIndex ?? existingCount;

  const session = await Session.create({
    ...sessionData,
    eventId,
    orderIndex,
    calculatedStartTime: sessionData.scheduledStartTime
  });

  const populated = await Session.findById(session._id).populate('speakerId');

  const allSessions = await Session.find({ eventId }).sort({ orderIndex: 1 }).populate('speakerId');
  socketService.emitToEvent(eventId, SOCKET_EVENTS.AGENDA_UPDATED, {
    eventId,
    sessions: allSessions
  });

  return populated;
};

export const startLiveSession = async (eventId, sessionId) => {
  // Set any currently live session to completed
  await Session.updateMany(
    { eventId, status: SESSION_STATUS.LIVE },
    { status: SESSION_STATUS.COMPLETED, actualEndTime: new Date() }
  );

  // Set selected session to LIVE
  const activeSession = await Session.findByIdAndUpdate(
    sessionId,
    {
      status: SESSION_STATUS.LIVE,
      actualStartTime: new Date()
    },
    { new: true }
  ).populate('speakerId');

  // Update event's currentSessionId
  await Event.findByIdAndUpdate(eventId, {
    currentSessionId: sessionId,
    status: 'LIVE'
  });

  // Find next upcoming session
  const nextSession = await Session.findOne({
    eventId,
    orderIndex: { $gt: activeSession.orderIndex },
    status: SESSION_STATUS.UPCOMING
  }).sort({ orderIndex: 1 }).populate('speakerId');

  const allSessions = await Session.find({ eventId }).sort({ orderIndex: 1 }).populate('speakerId');

  // Broadcast to all (Anchor teleprompter switches automatically)
  socketService.emitToEvent(eventId, SOCKET_EVENTS.SESSION_STARTED, {
    eventId,
    activeSession,
    nextSession
  });

  socketService.emitToEvent(eventId, SOCKET_EVENTS.SESSION_ACTIVATED, {
    eventId,
    session: activeSession,
    activeSession,
    nextSession
  });

  socketService.emitToEvent(eventId, SOCKET_EVENTS.AGENDA_UPDATED, {
    eventId,
    sessions: allSessions
  });

  return { activeSession, nextSession };
};

export const saveSessionScript = async (sessionId, scriptType, content) => {
  const updateField = `aiScripts.${scriptType}`;
  const session = await Session.findByIdAndUpdate(
    sessionId,
    { $set: { [updateField]: content } },
    { new: true }
  ).populate('speakerId');

  if (session) {
    socketService.emitToEvent(session.eventId, SOCKET_EVENTS.AI_SCRIPT_READY, {
      sessionId,
      scriptType,
      content
    });
  }

  return session;
};
