import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export const socketService = {
  /**
   * Broadcast an event to all clients in an event room
   */
  emitToEvent: (eventId, eventName, payload) => {
    try {
      const io = getIO();
      const room = `event_${eventId}`;
      io.to(room).emit(eventName, payload);
      logger.socket(eventName, room, { keys: Object.keys(payload || {}) });
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
      const room = `event_${eventId}_anchors`;
      io.to(room).emit(eventName, payload);
      logger.socket(eventName, room, payload);
    } catch (err) {
      logger.warn(`Could not emit to anchors [${eventName}]: ${err.message}`);
    }
  }
};
