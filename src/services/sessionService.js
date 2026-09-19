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

async function getEventState(eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const agendaList = await Agenda.find({ eventId })
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
  };
}

async function startSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  // Complete any currently LIVE session
  await Agenda.updateMany(
    { eventId, status: 'LIVE', _id: { $ne: agendaId } },
    { $set: { status: 'COMPLETED' } }
  );

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

  session.status = 'LIVE';
  await session.save();

  event.status = 'LIVE';
  event.currentSessionId = session._id;
  await event.save();

  const state = await getEventState(eventId);
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

  return { session, eventState: eventStatePayload };
}

async function completeSession(eventId, agendaId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const session = await Agenda.findById(agendaId).populate('speakerId');
  if (!session) throw new Error('Agenda session not found');

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

  const delayMs = delayMin * 60 * 1000;

  // 1. Extend current session endTime and delayMinutes
  session.endTime = new Date(new Date(session.endTime).getTime() + delayMs);
  session.delayMinutes = (session.delayMinutes || 0) + delayMin;
  session.durationMinutes = (session.durationMinutes || 0) + delayMin;
  await session.save();

  // 2. Adjust affected subsequent schedule items
  const subsequentSessions = await Agenda.find({
    eventId,
    _id: { $ne: session._id },
    orderIndex: { $gt: session.orderIndex },
    status: { $in: ['UPCOMING', 'DELAYED'] },
  }).sort({ orderIndex: 1 });

  for (const item of subsequentSessions) {
    item.startTime = new Date(new Date(item.startTime).getTime() + delayMs);
    item.endTime = new Date(new Date(item.endTime).getTime() + delayMs);
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
  const state = await getEventState(eventId);

  const delayPayload = {
    agendaId: session._id,
    delayMinutes: delayMin,
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
