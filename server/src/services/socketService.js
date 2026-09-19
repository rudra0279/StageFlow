import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export const socketService = {
  /**
   * Broadcast an event to clients in an event room with optional role/track scoping
   */
  emitToEvent: (eventId, eventName, payload, options = {}) => {
    try {
      const io = getIO();
      const mainRoom = `event_${eventId}`;
      const track = options.track || options.trackId;

      if (options.organizerOnly) {
        io.to(`${mainRoom}:organizers`).emit(eventName, payload);
      } else if (options.anchorOnly) {
        io.to(`${mainRoom}:anchors`).emit(eventName, payload);
        io.to(`event_${eventId}_anchors`).emit(eventName, payload);
        if (track) {
          io.to(`${mainRoom}:anchors:${track}`).emit(eventName, payload);
          io.to(`${mainRoom}:track:${track}`).emit(eventName, payload);
        }
      } else {
        io.to(mainRoom).emit(eventName, payload);
        io.to(`${mainRoom}:organizers`).emit(eventName, payload);
        io.to(`${mainRoom}:anchors`).emit(eventName, payload);
        io.to(`event_${eventId}_anchors`).emit(eventName, payload);
        if (track) {
          io.to(`${mainRoom}:anchors:${track}`).emit(eventName, payload);
          io.to(`${mainRoom}:track:${track}`).emit(eventName, payload);
        }
      }
      logger.socket(eventName, mainRoom, { keys: Object.keys(payload || {}) });
    } catch (err) {
      logger.warn(`Could not emit socket event [${eventName}]: ${err.message}`);
    }
  },

  /**
   * Broadcast an event specifically to anchors
   */
  emitToAnchors: (eventId, eventName, payload, track = null) => {
    try {
      const io = getIO();
      const room = `event_${eventId}_anchors`;
      io.to(room).emit(eventName, payload);
      io.to(`event_${eventId}:anchors`).emit(eventName, payload);
      if (track) {
        io.to(`event_${eventId}:anchors:${track}`).emit(eventName, payload);
        io.to(`event_${eventId}:track:${track}`).emit(eventName, payload);
      }
      logger.socket(eventName, room, payload);
    } catch (err) {
      logger.warn(`Could not emit to anchors [${eventName}]: ${err.message}`);
    }
  }
};
