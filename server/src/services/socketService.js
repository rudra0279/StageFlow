import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export const socketService = {
  /**
   * Broadcast an event to all clients in an event room
   */
  emitToEvent: (eventId, eventName, payload) => {
    try {
      const io = getIO();
      const rooms = [`event_${eventId}`, `event:${eventId}`];
      rooms.forEach(r => io.to(r).emit(eventName, payload));
      logger.socket(eventName, `event_${eventId}`, { keys: Object.keys(payload || {}) });
    } catch (err) {
      logger.warn(`Could not emit socket event [${eventName}]: ${err.message}`);
    }
  },

  /**
   * Broadcast an event specifically to anchors
   */
  emitToAnchors: (eventId, eventName, payload) => {
    try {
      const io = getIO();
      const rooms = [
        `event_${eventId}_anchors`,
        `event:${eventId}:anchors`,
        `event_${eventId}_anchor`
      ];
      rooms.forEach(r => io.to(r).emit(eventName, payload));
      logger.socket(eventName, `event_${eventId}_anchors`, payload);
    } catch (err) {
      logger.warn(`Could not emit to anchors [${eventName}]: ${err.message}`);
    }
  },

  /**
   * Broadcast an event specifically to organizers
   */
  emitToOrganizers: (eventId, eventName, payload) => {
    try {
      const io = getIO();
      const rooms = [
        `event_${eventId}_organizers`,
        `event:${eventId}:organizers`,
        `event_${eventId}_organizer`
      ];
      rooms.forEach(r => io.to(r).emit(eventName, payload));
      logger.socket(eventName, `event_${eventId}_organizers`, payload);
    } catch (err) {
      logger.warn(`Could not emit to organizers [${eventName}]: ${err.message}`);
    }
  },

  /**
   * Broadcast to any arbitrary room name
   */
  emitToRoom: (roomName, eventName, payload) => {
    try {
      const io = getIO();
      io.to(roomName).emit(eventName, payload);
    } catch (err) {
      logger.warn(`Could not emit to room [${roomName}] [${eventName}]: ${err.message}`);
    }
  }
};
