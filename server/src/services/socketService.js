import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export const socketService = {
  /**
   * Broadcast an event to clients in an event room with optional role/track scoping
   */
  emitToEvent: (eventId, eventName, payload, options = {}) => {
    try {
      const io = getIO();
      const mainRooms = [`event_${eventId}`, `event:${eventId}`];
      const track = options.track || options.trackId;

      if (options.organizerOnly) {
        io.to(`event_${eventId}:organizers`).emit(eventName, payload);
        io.to(`event:${eventId}:organizers`).emit(eventName, payload);
        io.to(`event_${eventId}_organizers`).emit(eventName, payload);
      } else if (options.anchorOnly) {
        io.to(`event_${eventId}:anchors`).emit(eventName, payload);
        io.to(`event:${eventId}:anchors`).emit(eventName, payload);
        io.to(`event_${eventId}_anchors`).emit(eventName, payload);
        if (track) {
          io.to(`event_${eventId}:anchors:${track}`).emit(eventName, payload);
          io.to(`event:${eventId}:anchors:${track}`).emit(eventName, payload);
          io.to(`event_${eventId}:track:${track}`).emit(eventName, payload);
          io.to(`event:${eventId}:track:${track}`).emit(eventName, payload);
        }
      } else {
        mainRooms.forEach(r => io.to(r).emit(eventName, payload));
        io.to(`event_${eventId}:organizers`).emit(eventName, payload);
        io.to(`event_${eventId}:anchors`).emit(eventName, payload);
        io.to(`event_${eventId}_anchors`).emit(eventName, payload);
        if (track) {
          io.to(`event_${eventId}:anchors:${track}`).emit(eventName, payload);
          io.to(`event_${eventId}:track:${track}`).emit(eventName, payload);
          io.to(`event:${eventId}:track:${track}`).emit(eventName, payload);
        }
      }
      logger.socket(eventName, `event_${eventId}`, { keys: Object.keys(payload || {}) });
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
      const rooms = [
        `event_${eventId}_anchors`,
        `event:${eventId}:anchors`,
        `event_${eventId}:anchors`,
        `event_${eventId}_anchor`
      ];
      rooms.forEach(r => io.to(r).emit(eventName, payload));
      if (track) {
        io.to(`event_${eventId}:anchors:${track}`).emit(eventName, payload);
        io.to(`event:${eventId}:anchors:${track}`).emit(eventName, payload);
        io.to(`event_${eventId}:track:${track}`).emit(eventName, payload);
        io.to(`event:${eventId}:track:${track}`).emit(eventName, payload);
      }
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
