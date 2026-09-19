import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { calculateScheduleHealth } from '../utils/calculateScheduleHealth.js';
import { addMinutesToDate } from '../utils/timeCalculators.js';
import { socketService } from './socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const getFullEventDetails = async (eventId) => {
  const event = await Event.findById(eventId).populate('organizerId', 'name email');
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }

  const sessions = await Session.find({ eventId })
    .sort({ orderIndex: 1 })
    .populate('speakerId');

  return { event, sessions };
};

/**
 * Injects a delay into a target session and cascades start times across all future sessions
 */
export const applySessionDelay = async (eventId, sessionId, delayMinutes, reason = '') => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const sessions = await Session.find({ eventId }).sort({ orderIndex: 1 });
  const targetIndex = sessions.findIndex((s) => s._id.toString() === sessionId.toString());

  if (targetIndex === -1) {
    throw new Error('Session not found in event schedule');
  }

  // 1. Add delay to target session
  sessions[targetIndex].delayOffsetMinutes += delayMinutes;

  // 2. Cascade start times for all sessions from targetIndex onwards
  let cumulativeDelay = 0;
  for (let i = 0; i < sessions.length; i++) {
    cumulativeDelay += (sessions[i].delayOffsetMinutes || 0);
    sessions[i].calculatedStartTime = addMinutesToDate(
      sessions[i].scheduledStartTime,
      cumulativeDelay
    );
    await sessions[i].save();
  }

  // 3. Update total delay on event & recalculate health status
  event.totalDelayMinutes = cumulativeDelay;
  event.healthStatus = calculateScheduleHealth(cumulativeDelay);
  await event.save();

  // 4. Populate speakers for frontend broadcast
  const updatedSessions = await Session.find({ eventId })
    .sort({ orderIndex: 1 })
    .populate('speakerId');

  // 5. Broadcast real-time Socket.IO payload
  socketService.emitToEvent(eventId, SOCKET_EVENTS.AGENDA_UPDATED, {
    eventId,
    sessions: updatedSessions,
    totalDelayMinutes: event.totalDelayMinutes,
    healthStatus: event.healthStatus
  });

  socketService.emitToEvent(eventId, SOCKET_EVENTS.DELAY_BROADCAST, {
    eventId,
    sessionId,
    delayMinutes,
    reason,
    totalDelayMinutes: event.totalDelayMinutes,
    healthStatus: event.healthStatus,
    targetSessionTitle: sessions[targetIndex].title
  });

  return {
    event,
    sessions: updatedSessions,
    delayMinutes,
    healthStatus: event.healthStatus
  };
};

export const updateEventStatus = async (eventId, status) => {
  const event = await Event.findByIdAndUpdate(
    eventId,
    { status },
    { new: true }
  );

  socketService.emitToEvent(eventId, SOCKET_EVENTS.HEALTH_STATUS_CHANGED, {
    eventId,
    status: event.status,
    healthStatus: event.healthStatus
  });

  return event;
};
