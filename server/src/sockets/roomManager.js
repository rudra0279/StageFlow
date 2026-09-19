import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { logger } from '../utils/logger.js';

export const registerRoomHandlers = (io, socket) => {
  // Join event room
  socket.on(SOCKET_EVENTS.JOIN_EVENT, ({ eventId, role }) => {
    if (!eventId) return;

    const mainRoom = `event_${eventId}`;
    socket.join(mainRoom);
    socket.eventId = eventId;
    socket.userRole = role;

    // If anchor, also join specific anchor sub-room
    if (role === 'ANCHOR') {
      socket.join(`event_${eventId}_anchors`);
    }

    logger.info(`Socket [${socket.id}] (${role || 'guest'}) joined room [${mainRoom}]`);

    socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
      eventId,
      status: 'connected',
      socketId: socket.id
    });
  });

  // Leave event room
  socket.on(SOCKET_EVENTS.LEAVE_EVENT, ({ eventId }) => {
    if (!eventId) return;
    socket.leave(`event_${eventId}`);
    socket.leave(`event_${eventId}_anchors`);
    logger.info(`Socket [${socket.id}] left room [event_${eventId}]`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: [${socket.id}]`);
  });
};
