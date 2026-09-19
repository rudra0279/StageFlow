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

export const startSession = async (eventId, sessionId) => {
  const session = await Session.findByIdAndUpdate(
    sessionId,
    { status: 'LIVE', actualStartTime: new Date() },
    { new: true }
  ).populate('speakerId');

  const track = session?.track || session?.room || session?.trackId || 'Track A';
  return { session, track };
};

export const delaySession = async (eventId, sessionId, delayMinutes) => {
  const targetSession = await Session.findById(sessionId);
  if (!targetSession) throw new Error('Session not found');

  const track = targetSession.track || targetSession.room || targetSession.trackId || 'Track A';

  // Find all sessions on this specific track
  const trackSessions = await Session.find({
    eventId,
    $or: [{ track }, { room: track }, { trackId: track }]
  }).sort({ orderIndex: 1, startTime: 1 });

  const targetIndex = trackSessions.findIndex(s => s._id.toString() === sessionId.toString());

  const shiftMs = delayMinutes * 60000;
  const affectedSessions = [];

  for (let i = 0; i < trackSessions.length; i++) {
    const s = trackSessions[i];
    if (i >= targetIndex) {
      s.delayMinutes = (s.delayMinutes || 0) + delayMinutes;
      s.delayOffsetMinutes = (s.delayOffsetMinutes || 0) + delayMinutes;
      if (s.endTime) s.endTime = new Date(new Date(s.endTime).getTime() + shiftMs);
      if (i > targetIndex && s.startTime) {
        s.startTime = new Date(new Date(s.startTime).getTime() + shiftMs);
      }
      await s.save();
      affectedSessions.push(s);
    }
  }

  const payload = {
    eventId,
    sessionId,
    track,
    delayMinutes,
    trackDelayMinutes: delayMinutes,
    affectedSessions
  };

  socketService.emitToEvent(eventId, 'sessionDelayed', payload);
  socketService.emitToEvent(eventId, SOCKET_EVENTS.DELAY_BROADCAST, payload);

  return payload;
};

export const getEventState = async (eventId, track) => {
  const query = { eventId };
  if (track) {
    query.$or = [{ track }, { room: track }, { trackId: track }];
  }
  const trackSessions = await Session.find(query).sort({ orderIndex: 1 }).populate('speakerId');
  const liveSession = trackSessions.find(s => s.status === 'LIVE') || trackSessions[0] || null;
  const nextSession = trackSessions.find(s => s.status === 'UPCOMING') || trackSessions[1] || null;

  return {
    eventId,
    currentTrack: track || 'Track A',
    currentSession: liveSession,
    nextSession,
    sessions: trackSessions
  };
};
