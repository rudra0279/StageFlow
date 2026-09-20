// src/socket/socketEmitter.js
const { getIO } = require('./socketServer');
const { SERVER_EVENTS, getEventRoom, getOrganizerChatRoom } = require('./socketEvents');
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

function emitToRoom(room, eventName, payload) {
  try {
    const io = getIO();
    io.to(room).emit(eventName, payload);
    logger.socket(`Broadcasted [${eventName}] to room [${room}]`, payload);
  } catch (error) {
    logger.error('[SOCKET]', `Failed to emit ${eventName} to room ${room}`, error);
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

  emitTaskCreated: (eventId, task) => {
<<<<<<< Updated upstream
    emitToEventRoom(eventId, SERVER_EVENTS.TASK_CREATED, {
      eventId,
      task,
      timestamp: new Date().toISOString(),
    });
  },

  emitTaskAssigned: (eventId, task) => {
    emitToEventRoom(eventId, SERVER_EVENTS.TASK_ASSIGNED, {
      eventId,
      task,
      timestamp: new Date().toISOString(),
    });
  },

  emitTaskUpdated: (eventId, task) => {
    emitToEventRoom(eventId, SERVER_EVENTS.TASK_UPDATED, {
      eventId,
      task,
      timestamp: new Date().toISOString(),
    });
  },

  emitTaskCompleted: (eventId, task) => {
    emitToEventRoom(eventId, SERVER_EVENTS.TASK_COMPLETED, {
      eventId,
      task,
      timestamp: new Date().toISOString(),
    });
  },

  emitTaskDeleted: (eventId, payload) => {
    emitToEventRoom(eventId, SERVER_EVENTS.TASK_DELETED, {
      eventId,
      ...payload,
      timestamp: new Date().toISOString(),
    });
  },

  emitOrganizerChatMessage: (eventId, chatMessage) => {
    const chatRoom = getOrganizerChatRoom(eventId);
    emitToRoom(chatRoom, SERVER_EVENTS.ORGANIZER_CHAT_MESSAGE, {
      eventId,
      message: chatMessage,
      timestamp: new Date().toISOString(),
    });
    emitToRoom(chatRoom, SERVER_EVENTS.CHAT_MESSAGE, {
      eventId,
      message: chatMessage,
      timestamp: new Date().toISOString(),
    });
=======
    try {
      const io = getIO();
      const payload = { eventId, task, timestamp: new Date().toISOString() };
      io.to(`event:${eventId}`).emit('taskCreated', payload);
      io.to(`event_${eventId}`).emit('taskCreated', payload);
      io.to(`event_${eventId}_organizers`).emit('taskCreated', payload);
      io.to(`event:${eventId}:organizers`).emit('taskCreated', payload);
      logger.socket(`Broadcasted [taskCreated] for event [${eventId}]`, task);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit taskCreated to event ${eventId}`, error);
    }
  },

  emitTaskUpdated: (eventId, task) => {
    try {
      const io = getIO();
      const payload = { eventId, task, timestamp: new Date().toISOString() };
      io.to(`event:${eventId}`).emit('taskUpdated', payload);
      io.to(`event_${eventId}`).emit('taskUpdated', payload);
      io.to(`event_${eventId}_organizers`).emit('taskUpdated', payload);
      io.to(`event:${eventId}:organizers`).emit('taskUpdated', payload);
      logger.socket(`Broadcasted [taskUpdated] for event [${eventId}]`, task);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit taskUpdated to event ${eventId}`, error);
    }
  },

  emitTaskDeleted: (eventId, taskId) => {
    try {
      const io = getIO();
      const payload = { eventId, taskId, timestamp: new Date().toISOString() };
      io.to(`event:${eventId}`).emit('taskDeleted', payload);
      io.to(`event_${eventId}`).emit('taskDeleted', payload);
      io.to(`event_${eventId}_organizers`).emit('taskDeleted', payload);
      io.to(`event:${eventId}:organizers`).emit('taskDeleted', payload);
      logger.socket(`Broadcasted [taskDeleted] for event [${eventId}]`, { taskId });
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit taskDeleted to event ${eventId}`, error);
    }
  },

  emitCommandChatMessage: (eventId, message) => {
    try {
      const io = getIO();
      const payload = { eventId, message, timestamp: new Date().toISOString() };
      io.to(`event:${eventId}`).emit('commandChatMessage', payload);
      io.to(`event_${eventId}`).emit('commandChatMessage', payload);
      io.to(`event_${eventId}_organizers`).emit('commandChatMessage', payload);
      io.to(`event:${eventId}:organizers`).emit('commandChatMessage', payload);
      logger.socket(`Broadcasted [commandChatMessage] for event [${eventId}]`, message);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit commandChatMessage to event ${eventId}`, error);
    }
>>>>>>> Stashed changes
  },
};

module.exports = socketEmitter;
