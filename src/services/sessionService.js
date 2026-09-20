// src/services/sessionService.js
const Event = require('../models/Event');
const Agenda = require('../models/Agenda');
const socketEmitter = require('../socket/socketEmitter');
const { logger } = require('../utils/logger');

function calculateHealth(delayTotalMinutes) {
  if (!delayTotalMinutes || delayTotalMinutes <= 0) return 'ON_TRACK';
  if (delayTotalMinutes <= 10) return 'SLIGHT_DELAY';
  return 'RUNNING_LATE';
}

/**
 * Get the current state of an event, optionally filtered to a specific track.
 * @param {string} eventId
 * @param {string|null} track - optional track filter
 */
async function getEventState(eventId, track) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  let agendaQuery = Agenda.find({ eventId }).populate('speakerId').sort({ orderIndex: 1, startTime: 1 });
  let agendaList = await agendaQuery;

  // Track-filtered agenda view
  let trackAgenda = agendaList;
  if (track) {
    trackAgenda = agendaList.filter(item => (item.track || item.trackId || null) === track);
  }

  const currentSession = trackAgenda.find(item => item.status === 'LIVE') ||
    (!track && event.currentSessionId
      ? agendaList.find(item => item._id.toString() === event.currentSessionId.toString())
      : null) ||
    null;

  let nextSession = null;
  if (currentSession) {
    nextSession = trackAgenda.find(
      item => item.status === 'UPCOMING' && item.orderIndex > currentSession.orderIndex
    ) || trackAgenda.find(item => item.status === 'UPCOMING' && item._id.toString() !== currentSession._id.toString()) || null;
  } else {
    nextSession = trackAgenda.find(item => item.status === 'UPCOMING') || null;
  }

  // Track-specific delay
  let trackDelayMinutes = 0;
  if (track && currentSession) {
    trackDelayMinutes = currentSession.delayMinutes || 0;
  }

  const eventHealth = calculateHealth(event.delayTotalMinutes);
  if (event.eventHealth !== eventHealth || String(event.currentSessionId) !== String(currentSession ? currentSession._id : null)) {
    event.eventHealth = eventHealth;
    if (!track) {
      event.currentSessionId = currentSession ? currentSession._id : null;
    }
    await event.save();
  }

  // Other tracks summary
  const otherTracks = track
    ? [...new Set(agendaList.map(item => item.track || item.trackId).filter(t => t && t !== track))]
        .map(otherTrack => {
          const otherCurrent = agendaList.find(item => (item.track || item.trackId) === otherTrack && item.status === 'LIVE');
          const otherNext = agendaList.find(item => (item.track || item.trackId) === otherTrack && item.status === 'UPCOMING');
          return { track: otherTrack, currentSession: otherCurrent || null, nextSession: otherNext || null };
        })
    : [];

  return {
    event,
    currentSession,
    nextSession,
    eventHealth,
    agendaList,
    currentTrack: track || null,
    trackDelayMinutes,
    otherTracks,
  };
}

async function startSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const targetSession = await Agenda.findById(agendaId);
  if (!targetSession) throw new Error('Agenda session not found');

  const sessionTrack = targetSession.track || targetSession.trackId || null;
  const track = sessionTrack || 'Track A';

  // Complete any currently LIVE session on the SAME track only (multi-track isolation)
  const liveOnSameTrack = await Agenda.find({
    eventId,
    status: 'LIVE',
    _id: { $ne: agendaId }
  });

  for (const liveSession of liveOnSameTrack) {
    const liveTrack = liveSession.track || liveSession.trackId || null;
    // Only complete if same track (or both trackless — single-track event)
    if ((liveTrack || 'Track A') === track) {
      liveSession.status = 'COMPLETED';
      await liveSession.save();
    }
  }

  const session = await Agenda.findById(agendaId).populate('speakerId');
  session.status = 'LIVE';
  await session.save();

  event.status = 'LIVE';
  event.currentSessionId = session._id;
  await event.save();

  const state = await getEventState(eventId, sessionTrack);
  logger.session(`Session started: "${session.title}" in event: ${event.name}`);

  const eventStatePayload = {
    state: event.status,
    eventHealth: state.eventHealth,
    currentSession: state.currentSession,
    nextSession: state.nextSession,
    delayTotalMinutes: event.delayTotalMinutes,
    currentTrack: track,
  };

  socketEmitter.emitSessionStarted(eventId, session, eventStatePayload);
  socketEmitter.emitEventStateChanged(eventId, eventStatePayload);

  return { session, eventState: eventStatePayload, track: sessionTrack, currentTrack: track };
}

async function completeSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

  const sessionTrack = session.track || session.trackId || null;

  session.status = 'COMPLETED';
  await session.save();

  if (event.currentSessionId && event.currentSessionId.toString() === agendaId.toString()) {
    event.currentSessionId = null;
    await event.save();
  }

  const state = await getEventState(eventId, session.track || session.trackId);
  logger.session(`Session completed: "${session.title}" in event: ${event.name}`);

  const eventStatePayload = {
    state: event.status,
    eventHealth: state.eventHealth,
    currentSession: state.currentSession,
    nextSession: state.nextSession,
    delayTotalMinutes: event.delayTotalMinutes,
  };

  socketEmitter.emitSessionCompleted(eventId, session, eventStatePayload);
  socketEmitter.emitEventStateChanged(eventId, eventStatePayload);

  return { session, eventState: eventStatePayload, track: sessionTrack };
}

async function skipSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

  const sessionTrack = session.track || session.trackId || null;

  session.status = 'SKIPPED';
  await session.save();

  if (event.currentSessionId && event.currentSessionId.toString() === agendaId.toString()) {
    event.currentSessionId = null;
    await event.save();
  }

  const state = await getEventState(eventId, session.track || session.trackId);
  logger.session(`Session skipped: "${session.title}" in event: ${event.name}`);

  const eventStatePayload = {
    state: event.status,
    eventHealth: state.eventHealth,
    currentSession: state.currentSession,
    nextSession: state.nextSession,
    delayTotalMinutes: event.delayTotalMinutes,
  };

  socketEmitter.emitSessionSkipped(eventId, session, eventStatePayload);
  socketEmitter.emitEventStateChanged(eventId, eventStatePayload);

  return { session, eventState: eventStatePayload, track: sessionTrack };
}

async function delaySession(eventId, agendaId, delayMinutes) {
  const delayMin = parseInt(delayMinutes, 10);
  if (!delayMin || delayMin <= 0) {
    throw new Error('Valid positive delayMinutes required (e.g. 5, 10, 15)');
  }

  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

  const sessionTrack = session.track || session.trackId || null;
  const targetTrack = sessionTrack || 'Track A';
  const delayMs = delayMin * 60 * 1000;

  session.endTime = new Date(new Date(session.endTime).getTime() + delayMs);
  session.delayMinutes = (session.delayMinutes || 0) + delayMin;
  session.durationMinutes = (session.durationMinutes || 0) + delayMin;
  await session.save();

  // Adjust affected subsequent schedule items for this specific track
  const allSubsequent = await Agenda.find({
    eventId,
    _id: { $ne: session._id },
    orderIndex: { $gt: session.orderIndex },
    status: { $in: ['UPCOMING', 'DELAYED'] },
  }).sort({ orderIndex: 1 });

  // Filter to same track only (track isolation)
  const subsequentSessions = allSubsequent.filter(item => {
    const itemTrack = item.track || item.trackId || null;
    return (itemTrack || 'Track A') === targetTrack;
  });

  for (const item of subsequentSessions) {
    item.startTime = new Date(new Date(item.startTime).getTime() + delayMs);
    item.endTime = new Date(new Date(item.endTime).getTime() + delayMs);
    item.delayMinutes = (item.delayMinutes || 0) + delayMin;
    await item.save();
  }

  event.delayTotalMinutes = (event.delayTotalMinutes || 0) + delayMin;
  event.eventHealth = calculateHealth(event.delayTotalMinutes);
  await event.save();

  logger.session(
    `Delayed session "${session.title}" by +${delayMin}m. Total delay: ${event.delayTotalMinutes}m. Health: ${event.eventHealth}`
  );

  // Recalculate event state
  const state = await getEventState(eventId, sessionTrack);

  const delayPayload = {
    agendaId: session._id,
    delayMinutes: delayMin,
    trackDelayMinutes: session.delayMinutes,
    track: sessionTrack,
    affectedSessions: [session, ...subsequentSessions],
    currentSession: state.currentSession,
    nextSession: state.nextSession,
    eventHealth: state.eventHealth,
    delayTotalMinutes: event.delayTotalMinutes,
    updatedSession: session,
  };

  const eventStatePayload = {
    state: event.status,
    eventHealth: state.eventHealth,
    currentSession: state.currentSession,
    nextSession: state.nextSession,
    delayTotalMinutes: event.delayTotalMinutes,
  };

  socketEmitter.emitSessionDelayed(eventId, delayPayload);
  socketEmitter.emitEventStateChanged(eventId, eventStatePayload);
  socketEmitter.emitAgendaUpdated(eventId, state.agendaList);

  return {
    session,
    delayMinutes: delayMin,
    track: sessionTrack,
    trackDelayMinutes: session.delayMinutes,
    eventHealth: state.eventHealth,
    currentSession: state.currentSession,
    nextSession: state.nextSession,
    agenda: state.agendaList,
    affectedSessions: [session, ...subsequentSessions],
  };
}

/**
 * Generate normalized Run-of-Show export data for an event.
 * Reuses the authoritative delay engine and multi-track separation state.
 * Sanitizes speaker data to omit private/sensitive fields.
 *
 * @param {string} eventId
 * @returns {Promise<Object|null>} Normalized run-of-show data or null if event not found
 */
async function getRunOfShowData(eventId) {
  const event = await Event.findById(eventId).populate('organizerId', 'name email');
  if (!event) return null;

  // Retrieve all sessions for this event, sorted by orderIndex and startTime
  const rawSessions = await Agenda.find({ eventId })
    .populate('speakerId')
    .sort({ orderIndex: 1, startTime: 1 });

  // Multi-track discovery & deterministic ordering
  const trackSet = new Set();
  for (const session of rawSessions) {
    const tName = session.track || session.trackId || (session.room && session.room !== 'Main Stage' ? session.room : 'Track A');
    trackSet.add(tName);
  }
  const trackNames = Array.from(trackSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Normalize sessions
  const normalizedSessions = rawSessions.map((session, idx) => {
    const tName = session.track || session.trackId || (session.room && session.room !== 'Main Stage' ? session.room : 'Track A');
    const delayOffset = session.delayMinutes || session.delayOffsetMinutes || 0;

    // Authoritative delay calculation: derive original scheduled times if not stored directly
    let scheduledStart = null;
    let scheduledEnd = null;
    const adjustedStart = session.startTime ? new Date(session.startTime).toISOString() : null;
    const adjustedEnd = session.endTime ? new Date(session.endTime).toISOString() : null;

    if (session.scheduledStartTime) {
      scheduledStart = new Date(session.scheduledStartTime).toISOString();
      scheduledEnd = session.scheduledEndTime
        ? new Date(session.scheduledEndTime).toISOString()
        : (session.durationMinutes && scheduledStart ? new Date(new Date(scheduledStart).getTime() + session.durationMinutes * 60000).toISOString() : adjustedEnd);
    } else if (delayOffset > 0 && adjustedStart && adjustedEnd) {
      if (session.status === 'LIVE') {
        scheduledStart = adjustedStart;
        scheduledEnd = new Date(new Date(adjustedEnd).getTime() - delayOffset * 60000).toISOString();
      } else {
        scheduledStart = new Date(new Date(adjustedStart).getTime() - delayOffset * 60000).toISOString();
        scheduledEnd = new Date(new Date(adjustedEnd).getTime() - delayOffset * 60000).toISOString();
      }
    } else {
      scheduledStart = adjustedStart;
      scheduledEnd = adjustedEnd;
    }

    // Sanitize speaker (no passwords, tokens, or private credentials)
    let speakerData = null;
    if (session.speakerId && typeof session.speakerId === 'object') {
      const sp = session.speakerId;
      speakerData = {
        id: sp._id ? sp._id.toString() : (sp.id ? sp.id.toString() : null),
        name: sp.name || '',
        title: sp.designation || sp.title || '',
        company: sp.organization || sp.company || '',
        organization: sp.organization || sp.company || '',
        pronunciationGuide: sp.pronunciationGuide || '',
        pronunciation: sp.pronunciationGuide || '',
        topic: sp.topic || '',
        bio: sp.bio || '',
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
      adjustedStart,
      adjustedEnd,
      currentStart: adjustedStart,
      currentEnd: adjustedEnd,
      duration,
      durationMinutes: duration,
      delayOffset,
      delayMinutes: delayOffset,
      status: session.status || 'UPCOMING',
      orderIndex: sessionOrder,
      index: sessionOrder,
      track: tName,
      trackId: tName,
      type: session.type || 'KEYNOTE',
      room: session.room || 'Main Stage',
    };
  });

  // Partition sessions into tracks with strict multi-track isolation
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
      sessions: trackSessions,
    };
  });

  const totalDelay = typeof event.delayTotalMinutes === 'number'
    ? event.delayTotalMinutes
    : (event.totalDelayMinutes || 0);

  const eventData = {
    id: event._id.toString(),
    eventId: event._id.toString(),
    title: event.name || event.title || 'Untitled Event',
    name: event.name || event.title || 'Untitled Event',
    description: event.description || '',
    date: event.date ? new Date(event.date).toISOString() : null,
    venue: event.venue || 'Main Venue',
    status: event.status || 'UPCOMING',
    healthStatus: event.eventHealth || event.healthStatus || calculateHealth(totalDelay),
    eventHealth: event.eventHealth || event.healthStatus || calculateHealth(totalDelay),
    currentTotalDelay: totalDelay,
    delayTotalMinutes: totalDelay,
    startTime: event.startTime ? new Date(event.startTime).toISOString() : null,
    endTime: event.endTime ? new Date(event.endTime).toISOString() : null,
    exportTimestamp: new Date().toISOString(),
    totalTracks: tracks.length,
    totalSessions: normalizedSessions.length,
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
      exportTimestamp: eventData.exportTimestamp,
    },
  };
}

module.exports = {
  getEventState,
  startSession,
  completeSession,
  skipSession,
  delaySession,
  calculateHealth,
  getRunOfShowData,
};
