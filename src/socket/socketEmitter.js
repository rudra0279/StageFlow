// src/socket/socketEmitter.js
const { getIO } = require('./socketServer');
const { SERVER_EVENTS, getEventRoom } = require('./socketEvents');
const { logger } = require('../utils/logger');

function emitToEventRoom(eventId, eventName, payload) {
  try {
    const io = getIO();
    const room = getEventRoom(eventId);
    io.to(room).emit(eventName, payload);
    logger.socket(`Broadcasted [${eventName}] to room [${room}]`, payload);
  } catch (error) {
    logger.error('[SOCKET]', `Failed to emit ${eventName} to event ${eventId}`, error);
  }
}

const socketEmitter = {
  emitAgendaUpdated: (eventId, agendaList) => {
    emitToEventRoom(eventId, SERVER_EVENTS.AGENDA_UPDATED, {
      eventId,
      agenda: agendaList,
      timestamp: new Date().toISOString(),
    });
  },

  emitSessionStarted: (eventId, session, eventState) => {
    emitToEventRoom(eventId, SERVER_EVENTS.SESSION_STARTED, {
      eventId,
      session,
      currentSession: session,
      nextSession: eventState ? eventState.nextSession : null,
      timestamp: new Date().toISOString(),
    });
  },

  emitSessionCompleted: (eventId, session, eventState) => {
    emitToEventRoom(eventId, SERVER_EVENTS.SESSION_COMPLETED, {
      eventId,
      session,
      currentSession: eventState ? eventState.currentSession : null,
      nextSession: eventState ? eventState.nextSession : null,
      timestamp: new Date().toISOString(),
    });
  },

  emitSessionDelayed: (eventId, delayPayload) => {
    // delayPayload: { agendaId, delayMinutes, currentSession, nextSession, eventHealth, updatedAgenda }
    emitToEventRoom(eventId, SERVER_EVENTS.SESSION_DELAYED, {
      eventId,
      ...delayPayload,
      timestamp: new Date().toISOString(),
    });
  },

  emitSessionSkipped: (eventId, session, eventState) => {
    emitToEventRoom(eventId, SERVER_EVENTS.SESSION_SKIPPED, {
      eventId,
      session,
      currentSession: eventState ? eventState.currentSession : null,
      nextSession: eventState ? eventState.nextSession : null,
      timestamp: new Date().toISOString(),
    });
  },

  emitAnnouncementCreated: (eventId, announcement) => {
    emitToEventRoom(eventId, SERVER_EVENTS.ANNOUNCEMENT_CREATED, {
      eventId,
      announcement,
      timestamp: new Date().toISOString(),
    });
  },

  emitEventStateChanged: (eventId, statePayload) => {
    // statePayload: { state, eventHealth, currentSession, nextSession, delayTotalMinutes }
    emitToEventRoom(eventId, SERVER_EVENTS.EVENT_STATE_CHANGED, {
      eventId,
      ...statePayload,
      timestamp: new Date().toISOString(),
    });
  },
};

module.exports = socketEmitter;
