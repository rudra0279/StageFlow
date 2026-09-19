import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { logger } from '../utils/logger.js';

export const registerRoomHandlers = (io, socket) => {
  const handleJoin = ({ eventId, role, track }) => {
    if (!eventId) return;

    socket.eventId = eventId;
    socket.userRole = role || socket.userRole;
    if (track) socket.track = track;

    const mainRoom = `event_${eventId}`;

    // Join main event rooms
    socket.join(mainRoom);
    socket.join(`event:${eventId}`);

    const normalizedRole = (role || socket.userRole || '').toUpperCase();

    if (normalizedRole === 'ORGANIZER') {
      socket.join(`${mainRoom}:organizers`);
      socket.join(`event:${eventId}:organizers`);
      socket.join(`${mainRoom}_organizers`);
      socket.join(`${mainRoom}_organizer`);
    } else if (normalizedRole === 'ANCHOR') {
      socket.join(`${mainRoom}:anchors`);
      socket.join(`event:${eventId}:anchors`);
      socket.join(`${mainRoom}_anchors`);
      socket.join(`${mainRoom}_anchor`);
      if (track) {
        socket.join(`${mainRoom}:anchors:${track}`);
        socket.join(`event:${eventId}:anchors:${track}`);
        socket.join(`${mainRoom}:track:${track}`);
        socket.join(`event:${eventId}:track:${track}`);
        socket.join(`${mainRoom}_anchor_${track}`);
        socket.join(`${mainRoom}_track_${track}`);
      }
    } else if (normalizedRole === 'AUDIENCE') {
      socket.join(`${mainRoom}:audience`);
      socket.join(`event:${eventId}:audience`);
      socket.join(`${mainRoom}_audience`);
    }

    if (track) {
      socket.join(`${mainRoom}:track:${track}`);
      socket.join(`event:${eventId}:track:${track}`);
      socket.join(`${mainRoom}_track_${track}`);
    }

    logger.info(`Socket [${socket.id}] (${role || 'guest'}, track: ${track || 'none'}) joined event [${eventId}]`);

    const confirmationPayload = {
      eventId,
      room: mainRoom,
      role: role || socket.userRole,
      track: track || socket.track,
      status: 'connected',
      socketId: socket.id,
      success: true
    };

    socket.emit('joinedEvent', confirmationPayload);
    if (SOCKET_EVENTS.ROOM_JOINED) {
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, confirmationPayload);
    }
    socket.emit('room_joined', confirmationPayload);
  };

  socket.on(SOCKET_EVENTS.JOIN_EVENT, handleJoin);
  socket.on('join_room', handleJoin);
  socket.on('joinEvent', handleJoin);

  const handleJoinTrack = ({ eventId, track }) => {
    const targetEventId = eventId || socket.eventId;
    if (!targetEventId || !track) return;

    if (socket.currentTrack) {
      socket.leave(`event_${targetEventId}_track_${socket.currentTrack}`);
      socket.leave(`event:${targetEventId}:track:${socket.currentTrack}`);
      socket.leave(`event_${targetEventId}:track:${socket.currentTrack}`);
      socket.leave(`event_${targetEventId}:anchors:${socket.currentTrack}`);
    }

    socket.currentTrack = track;
    socket.track = track;
    socket.join(`event_${targetEventId}_track_${track}`);
    socket.join(`event:${targetEventId}:track:${track}`);
    socket.join(`event_${targetEventId}:track:${track}`);
    socket.join(`event_${targetEventId}:anchors:${track}`);

    logger.info(`Socket [${socket.id}] joined track [${track}] in event [${targetEventId}]`);

    const payload = { eventId: targetEventId, track, socketId: socket.id, success: true };
    socket.emit('joinedTrack', payload);
    socket.emit('track_joined', payload);
  };

  socket.on('joinTrack', handleJoinTrack);
  socket.on('join_track', handleJoinTrack);

  socket.on(SOCKET_EVENTS.LEAVE_EVENT, ({ eventId }) => {
    if (!eventId) return;
    const mainRoom = `event_${eventId}`;
    socket.leave(mainRoom);
    socket.leave(`event:${eventId}`);
    socket.leave(`${mainRoom}:organizers`);
    socket.leave(`event:${eventId}:organizers`);
    socket.leave(`${mainRoom}_organizers`);
    socket.leave(`${mainRoom}:anchors`);
    socket.leave(`event:${eventId}:anchors`);
    socket.leave(`${mainRoom}_anchors`);
    if (socket.track) {
      socket.leave(`${mainRoom}:track:${socket.track}`);
      socket.leave(`event:${eventId}:track:${socket.track}`);
    }
    logger.info(`Socket [${socket.id}] left room [${mainRoom}]`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: [${socket.id}]`);
  });
};
