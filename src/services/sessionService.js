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

  // Complete any currently LIVE session on the SAME track only (multi-track isolation)
  const liveOnSameTrack = await Agenda.find({
    eventId,
    status: 'LIVE',
    _id: { $ne: agendaId }
  });

  for (const liveSession of liveOnSameTrack) {
    const liveTrack = liveSession.track || liveSession.trackId || null;
    // Only complete if same track (or both trackless — single-track event)
    if (liveTrack === sessionTrack) {
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
  };

  socketEmitter.emitSessionStarted(eventId, session, eventStatePayload);
  socketEmitter.emitEventStateChanged(eventId, eventStatePayload);

  return { session, eventState: eventStatePayload, track: sessionTrack };
}

async function completeSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

  const sessionTrack = session.track || session.trackId || null;

  session.status = 'COMPLETED';
  await session.save();

  // If this was current session, clear or advance
  if (event.currentSessionId && event.currentSessionId.toString() === agendaId.toString()) {
    event.currentSessionId = null;
    await event.save();
  }

  const state = await getEventState(eventId);
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

  const state = await getEventState(eventId);
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
  const delayMs = delayMin * 60 * 1000;

  // 1. Extend current session endTime and delayMinutes
  session.endTime = new Date(new Date(session.endTime).getTime() + delayMs);
  session.delayMinutes = (session.delayMinutes || 0) + delayMin;
  session.durationMinutes = (session.durationMinutes || 0) + delayMin;
  await session.save();

  // 2. Adjust affected subsequent schedule items for this specific track
  const allSubsequent = await Agenda.find({
    eventId,
    _id: { $ne: session._id },
    orderIndex: { $gt: session.orderIndex },
    status: { $in: ['UPCOMING', 'DELAYED'] },
  }).sort({ orderIndex: 1 });

  // Filter to same track only (track isolation)
  const subsequentSessions = allSubsequent.filter(item => {
    const itemTrack = item.track || item.trackId || null;
    return itemTrack === sessionTrack;
  });

  for (const item of subsequentSessions) {
    item.startTime = new Date(new Date(item.startTime).getTime() + delayMs);
    item.endTime = new Date(new Date(item.endTime).getTime() + delayMs);
    item.delayMinutes = (item.delayMinutes || 0) + delayMin;
    await item.save();
  }

  // 3. Update event cumulative delay & health
  event.delayTotalMinutes = (event.delayTotalMinutes || 0) + delayMin;
  event.eventHealth = calculateHealth(event.delayTotalMinutes);
  await event.save();

  logger.session(
    `Delayed session "${session.title}" by +${delayMin}m. Total delay: ${event.delayTotalMinutes}m. Health: ${event.eventHealth}`
  );

  // 4. Recalculate event state
  const state = await getEventState(eventId, sessionTrack);

  // Track-specific cumulative delay
  const trackDelayMinutes = subsequentSessions.reduce((sum, s) => sum + (s.delayMinutes || 0), session.delayMinutes || 0) / (subsequentSessions.length + 1);

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

  // 5. Broadcast changes via Socket.IO
  socketEmitter.emitSessionDelayed(eventId, delayPayload);
  socketEmitter.emitEventStateChanged(eventId, eventStatePayload);
  socketEmitter.emitAgendaUpdated(eventId, state.agendaList);

  return {
    session,
    delayMinutes: delayMin,
    trackDelayMinutes: session.delayMinutes,
    eventHealth: state.eventHealth,
    currentSession: state.currentSession,
    nextSession: state.nextSession,
    agenda: state.agendaList,
    track: sessionTrack,
    affectedSessions: [session, ...subsequentSessions],
  };
}

module.exports = {
  getEventState,
  startSession,
  completeSession,
  skipSession,
  delaySession,
  calculateHealth,
};
