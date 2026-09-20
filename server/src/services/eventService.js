import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { Speaker } from '../models/Speaker.js';
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

  const speakers = await Speaker.find({ eventId });

  return { event, sessions, speakers };
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

/**
 * Generate normalized Run-of-Show export data for an event in server/src.
 * Reuses authoritative cascading delay values and multi-track separation.
 * Sanitizes speaker profiles to prevent private credential leakage.
 */
export const getRunOfShowData = async (eventId) => {
  const event = await Event.findById(eventId).populate('organizerId', 'name email');
  if (!event) return null;

  const rawSessions = await Session.find({ eventId })
    .populate('speakerId')
    .sort({ orderIndex: 1, scheduledStartTime: 1, startTime: 1 });

  // Distinct tracks
  const trackSet = new Set();
  for (const session of rawSessions) {
    const tName = session.track || session.trackId || (session.room && session.room !== 'Main Stage' ? session.room : 'Track A');
    trackSet.add(tName);
  }
  const trackNames = Array.from(trackSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const normalizedSessions = rawSessions.map((session, idx) => {
    const tName = session.track || session.trackId || (session.room && session.room !== 'Main Stage' ? session.room : 'Track A');
    const delayOffset = session.delayOffsetMinutes || session.delayMinutes || 0;

    const adjustedStart = session.calculatedStartTime || session.startTime || session.scheduledStartTime;
    const adjustedEnd = session.endTime || (adjustedStart && session.durationMinutes ? new Date(new Date(adjustedStart).getTime() + session.durationMinutes * 60000) : null);

    let scheduledStart = session.scheduledStartTime;
    let scheduledEnd = null;

    if (scheduledStart) {
      scheduledStart = new Date(scheduledStart).toISOString();
      scheduledEnd = session.durationMinutes
        ? new Date(new Date(scheduledStart).getTime() + session.durationMinutes * 60000).toISOString()
        : (adjustedEnd ? new Date(adjustedEnd).toISOString() : null);
    } else if (delayOffset > 0 && adjustedStart && adjustedEnd) {
      scheduledStart = new Date(new Date(adjustedStart).getTime() - delayOffset * 60000).toISOString();
      scheduledEnd = new Date(new Date(adjustedEnd).getTime() - delayOffset * 60000).toISOString();
    } else {
      scheduledStart = adjustedStart ? new Date(adjustedStart).toISOString() : null;
      scheduledEnd = adjustedEnd ? new Date(adjustedEnd).toISOString() : null;
    }

    let speakerData = null;
    if (session.speakerId && typeof session.speakerId === 'object') {
      const sp = session.speakerId;
      speakerData = {
        id: sp._id ? sp._id.toString() : (sp.id ? sp.id.toString() : null),
        name: sp.name || '',
        title: sp.title || sp.designation || '',
        company: sp.company || sp.organization || '',
        organization: sp.organization || sp.company || '',
        pronunciationGuide: sp.pronunciationGuide || sp.phoneticName || '',
        pronunciation: sp.pronunciationGuide || sp.phoneticName || '',
        topic: sp.topic || '',
        bio: sp.bio || sp.biography || ''
      };
    }

    const duration = session.durationMinutes || (
      adjustedStart && adjustedEnd
        ? Math.round((new Date(adjustedEnd).getTime() - new Date(adjustedStart).getTime()) / 60000)
        : 0
    );

    const sessionOrder = typeof session.orderIndex === 'number' ? session.orderIndex : idx;

    return {
      sessionId: session._id.toString(),
      id: session._id.toString(),
      title: session.title || '',
      description: session.description || '',
      speaker: speakerData,
      speakerInfo: speakerData,
      scheduledStart,
      scheduledEnd,
      adjustedStart: adjustedStart ? new Date(adjustedStart).toISOString() : null,
      adjustedEnd: adjustedEnd ? new Date(adjustedEnd).toISOString() : null,
      currentStart: adjustedStart ? new Date(adjustedStart).toISOString() : null,
      currentEnd: adjustedEnd ? new Date(adjustedEnd).toISOString() : null,
      duration,
      durationMinutes: duration,
      delayOffset,
      delayMinutes: delayOffset,
      status: session.status || 'UPCOMING',
      orderIndex: sessionOrder,
      index: sessionOrder,
      track: tName,
      trackId: tName,
      type: session.type || 'presentation',
      room: session.room || 'Main Stage'
    };
  });

  const tracks = trackNames.map((tName, tIdx) => {
    const trackSessions = normalizedSessions.filter(s => s.track === tName);
    trackSessions.sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      if (a.scheduledStart && b.scheduledStart) {
        return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
      }
      return 0;
    });

    const trackDelayMinutes = trackSessions.reduce((max, s) => Math.max(max, s.delayOffset || 0), 0);

    return {
      trackIdentifier: tName,
      trackId: tName,
      trackName: tName,
      trackOrdering: tIdx + 1,
      sessionCount: trackSessions.length,
      trackDelayMinutes,
      sessions: trackSessions
    };
  });

  const totalDelay = typeof event.totalDelayMinutes === 'number'
    ? event.totalDelayMinutes
    : (event.delayTotalMinutes || 0);

  const eventData = {
    id: event._id.toString(),
    eventId: event._id.toString(),
    title: event.name || event.title || 'Untitled Event',
    name: event.name || event.title || 'Untitled Event',
    description: event.description || '',
    date: event.date ? new Date(event.date).toISOString() : null,
    venue: event.venue || 'Main Venue',
    status: event.status || 'UPCOMING',
    healthStatus: event.healthStatus || event.eventHealth || calculateScheduleHealth(totalDelay),
    eventHealth: event.healthStatus || event.eventHealth || calculateScheduleHealth(totalDelay),
    currentTotalDelay: totalDelay,
    delayTotalMinutes: totalDelay,
    startTime: event.startTime ? new Date(event.startTime).toISOString() : null,
    endTime: event.endTime ? new Date(event.endTime).toISOString() : null,
    exportTimestamp: new Date().toISOString(),
    totalTracks: tracks.length,
    totalSessions: normalizedSessions.length
  };

  return {
    event: eventData,
    tracks,
    sessions: normalizedSessions,
    summary: {
      totalTracks: tracks.length,
      totalSessions: normalizedSessions.length,
      totalDelayMinutes: totalDelay,
      eventHealth: eventData.eventHealth,
      exportTimestamp: eventData.exportTimestamp
    }
  };
};

