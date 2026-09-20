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
    try {
      const io = getIO();
      const payload = { eventId, task, timestamp: new Date().toISOString() };
      io.to(`event:${eventId}`).emit('taskCreated', payload);
      io.to(`event:${eventId}`).emit(SERVER_EVENTS.TASK_CREATED || 'task_created', payload);
      io.to(`event_${eventId}`).emit('taskCreated', payload);
      io.to(`event_${eventId}_organizers`).emit('taskCreated', payload);
      io.to(`event:${eventId}:organizers`).emit('taskCreated', payload);
      emitToEventRoom(eventId, SERVER_EVENTS.TASK_CREATED || 'task_created', payload);
      logger.socket(`Broadcasted [taskCreated] for event [${eventId}]`, task);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit taskCreated to event ${eventId}`, error);
    }
  },

  emitTaskAssigned: (eventId, task) => {
    try {
      const io = getIO();
      const payload = { eventId, task, timestamp: new Date().toISOString() };
      io.to(`event:${eventId}`).emit('taskAssigned', payload);
      io.to(`event:${eventId}`).emit(SERVER_EVENTS.TASK_ASSIGNED || 'task_assigned', payload);
      emitToEventRoom(eventId, SERVER_EVENTS.TASK_ASSIGNED || 'task_assigned', payload);
      logger.socket(`Broadcasted [taskAssigned] for event [${eventId}]`, task);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit taskAssigned to event ${eventId}`, error);
    }
  },

  emitTaskUpdated: (eventId, task) => {
    try {
      const io = getIO();
      const payload = { eventId, task, timestamp: new Date().toISOString() };
      io.to(`event:${eventId}`).emit('taskUpdated', payload);
      io.to(`event:${eventId}`).emit(SERVER_EVENTS.TASK_UPDATED || 'task_updated', payload);
      io.to(`event_${eventId}`).emit('taskUpdated', payload);
      io.to(`event_${eventId}_organizers`).emit('taskUpdated', payload);
      io.to(`event:${eventId}:organizers`).emit('taskUpdated', payload);
      emitToEventRoom(eventId, SERVER_EVENTS.TASK_UPDATED || 'task_updated', payload);
      logger.socket(`Broadcasted [taskUpdated] for event [${eventId}]`, task);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit taskUpdated to event ${eventId}`, error);
    }
  },

  emitTaskCompleted: (eventId, task) => {
    try {
      const io = getIO();
      const payload = { eventId, task, timestamp: new Date().toISOString() };
      io.to(`event:${eventId}`).emit('taskCompleted', payload);
      io.to(`event:${eventId}`).emit(SERVER_EVENTS.TASK_COMPLETED || 'task_completed', payload);
      emitToEventRoom(eventId, SERVER_EVENTS.TASK_COMPLETED || 'task_completed', payload);
      logger.socket(`Broadcasted [taskCompleted] for event [${eventId}]`, task);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit taskCompleted to event ${eventId}`, error);
    }
  },

  emitTaskDeleted: (eventId, payloadOrTaskId) => {
    try {
      const io = getIO();
      const taskId = typeof payloadOrTaskId === 'object' && payloadOrTaskId ? (payloadOrTaskId.taskId || payloadOrTaskId.id) : payloadOrTaskId;
      const payload = typeof payloadOrTaskId === 'object' ? { eventId, ...payloadOrTaskId, taskId } : { eventId, taskId };
      payload.timestamp = new Date().toISOString();
      io.to(`event:${eventId}`).emit('taskDeleted', payload);
      io.to(`event:${eventId}`).emit(SERVER_EVENTS.TASK_DELETED || 'task_deleted', payload);
      io.to(`event_${eventId}`).emit('taskDeleted', payload);
      io.to(`event_${eventId}_organizers`).emit('taskDeleted', payload);
      io.to(`event:${eventId}:organizers`).emit('taskDeleted', payload);
      emitToEventRoom(eventId, SERVER_EVENTS.TASK_DELETED || 'task_deleted', payload);
      logger.socket(`Broadcasted [taskDeleted] for event [${eventId}]`, { taskId });
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit taskDeleted to event ${eventId}`, error);
    }
  },

  emitOrganizerChatMessage: (eventId, chatMessage) => {
    try {
      const io = getIO();
      const payload = { eventId, message: chatMessage, timestamp: new Date().toISOString() };
      const chatRoom = getOrganizerChatRoom(eventId);
      io.to(chatRoom).emit(SERVER_EVENTS.ORGANIZER_CHAT_MESSAGE || 'organizer_chat_message', payload);
      io.to(chatRoom).emit(SERVER_EVENTS.CHAT_MESSAGE || 'chat_message', payload);
      io.to(`event:${eventId}`).emit('commandChatMessage', payload);
      io.to(`event_${eventId}`).emit('commandChatMessage', payload);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit organizerChatMessage to event ${eventId}`, error);
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
      const chatRoom = getOrganizerChatRoom(eventId);
      io.to(chatRoom).emit(SERVER_EVENTS.ORGANIZER_CHAT_MESSAGE || 'organizer_chat_message', payload);
      logger.socket(`Broadcasted [commandChatMessage] for event [${eventId}]`, message);
    } catch (error) {
      logger.error('[SOCKET]', `Failed to emit commandChatMessage to event ${eventId}`, error);
    }
  },
};

module.exports = socketEmitter;
