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

async function getEventState(eventId, track) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  let filter = { eventId };
  if (track) {
    filter.$or = [{ track }, { room: track }, { trackId: track }];
  }

  const agendaList = await Agenda.find(filter)
    .populate('speakerId')
    .sort({ orderIndex: 1, startTime: 1 });

  const currentSession = agendaList.find(item => item.status === 'LIVE') ||
    (event.currentSessionId ? agendaList.find(item => item._id.toString() === event.currentSessionId.toString()) : null) ||
    null;

  let nextSession = null;
  if (currentSession) {
    nextSession = agendaList.find(
      item => item.status === 'UPCOMING' && item.orderIndex > currentSession.orderIndex
    ) || agendaList.find(item => item.status === 'UPCOMING' && item._id.toString() !== currentSession._id.toString()) || null;
  } else {
    nextSession = agendaList.find(item => item.status === 'UPCOMING') || null;
  }

  const eventHealth = calculateHealth(event.delayTotalMinutes);
  if (event.eventHealth !== eventHealth || String(event.currentSessionId) !== String(currentSession ? currentSession._id : null)) {
    event.eventHealth = eventHealth;
    event.currentSessionId = currentSession ? currentSession._id : null;
    await event.save();
  }

  return {
    event,
    currentSession,
    nextSession,
    eventHealth,
    agendaList,
    currentTrack: track || 'Track A',
    trackDelayMinutes: currentSession ? (currentSession.delayMinutes || 0) : 0,
  };
}

async function startSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

  const track = session.track || session.trackId || 'Track A';

  // Complete any currently LIVE session in this track
  const otherSessions = await Agenda.find({ eventId });
  for (const s of otherSessions) {
    const sTrack = s.track || s.trackId || 'Track A';
    if (sTrack === track && s.status === 'LIVE' && s._id.toString() !== agendaId.toString()) {
      s.status = 'COMPLETED';
      await s.save();
    }
  }

  session.status = 'LIVE';
  await session.save();

  event.status = 'LIVE';
  event.currentSessionId = session._id;
  await event.save();

  const state = await getEventState(eventId, track);
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

  return { session, eventState: eventStatePayload, track, currentTrack: track };
}

async function completeSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

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

  return { session, eventState: eventStatePayload };
}

async function skipSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

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

  return { session, eventState: eventStatePayload };
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

  const targetTrack = session.track || session.trackId || 'Track A';
  const delayMs = delayMin * 60 * 1000;

  session.endTime = new Date(new Date(session.endTime).getTime() + delayMs);
  session.delayMinutes = (session.delayMinutes || 0) + delayMin;
  session.durationMinutes = (session.durationMinutes || 0) + delayMin;
  await session.save();

  const allAgenda = await Agenda.find({ eventId }).sort({ orderIndex: 1 });
  const subsequentSessions = allAgenda.filter(s => {
    const sTrack = s.track || s.trackId || 'Track A';
    return sTrack === targetTrack && s._id.toString() !== session._id.toString() && s.orderIndex > session.orderIndex;
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

  const state = await getEventState(eventId, targetTrack);

  const delayPayload = {
    agendaId: session._id,
    delayMinutes: delayMin,
    track: targetTrack,
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
    track: targetTrack,
    trackDelayMinutes: delayMin,
    eventHealth: state.eventHealth,
    currentSession: state.currentSession,
    nextSession: state.nextSession,
    agenda: state.agendaList,
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
