import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { logger } from '../utils/logger.js';

export const registerRoomHandlers = (io, socket) => {
  const handleJoin = ({ eventId, role, track }) => {
    if (!eventId) return;

    const mainRoom = `event_${eventId}`;
    socket.join(mainRoom);
    socket.eventId = eventId;
    socket.userRole = role;

    const normalizedRole = (role || '').toUpperCase();
    if (normalizedRole === 'ORGANIZER') {
      socket.join(`${mainRoom}:organizers`);
    } else if (normalizedRole === 'ANCHOR') {
      socket.join(`${mainRoom}:anchors`);
      socket.join(`event_${eventId}_anchors`);
      if (track) {
        socket.join(`${mainRoom}:anchors:${track}`);
        socket.join(`${mainRoom}:track:${track}`);
      }
    } else if (normalizedRole === 'AUDIENCE') {
      socket.join(`${mainRoom}:audience`);
    }

    logger.info(`Socket [${socket.id}] (${role || 'guest'}, track: ${track || 'none'}) joined room [${mainRoom}]`);

    socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
      eventId,
      status: 'connected',
      socketId: socket.id,
      track
    });

    socket.emit('joinedEvent', {
      eventId,
      room: mainRoom,
      status: 'connected',
      socketId: socket.id,
      track,
      success: true
    });
  };

  socket.on(SOCKET_EVENTS.JOIN_EVENT, handleJoin);
  socket.on('join_room', handleJoin);

  socket.on('joinTrack', ({ eventId, track }) => {
    if (!eventId || !track) return;
    const mainRoom = `event_${eventId}`;
    socket.join(`${mainRoom}:track:${track}`);
    socket.join(`${mainRoom}:anchors:${track}`);
    socket.emit('joinedTrack', { eventId, track, success: true });
  });

  // Leave event room
  socket.on(SOCKET_EVENTS.LEAVE_EVENT, ({ eventId }) => {
    if (!eventId) return;
    const mainRoom = `event_${eventId}`;
    socket.leave(mainRoom);
    socket.leave(`${mainRoom}:organizers`);
    socket.leave(`${mainRoom}:anchors`);
    socket.leave(`event_${eventId}_anchors`);
    logger.info(`Socket [${socket.id}] left room [${mainRoom}]`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: [${socket.id}]`);
  });
};
