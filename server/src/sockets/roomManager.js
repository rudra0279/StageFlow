import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { logger } from '../utils/logger.js';

export const registerRoomHandlers = (io, socket) => {
  const handleJoin = ({ eventId, role, track }) => {
    if (!eventId) return;

    socket.eventId = eventId;
    socket.userRole = role || socket.userRole;
    if (track) socket.track = track;

    // Join main event rooms
    socket.join(`event_${eventId}`);
    socket.join(`event:${eventId}`);

    const normalizedRole = (role || socket.userRole || '').toUpperCase();

    if (normalizedRole === 'ORGANIZER') {
      socket.join(`event_${eventId}_organizers`);
      socket.join(`event:${eventId}:organizers`);
      socket.join(`event_${eventId}_organizer`);
    } else if (normalizedRole === 'ANCHOR') {
      socket.join(`event_${eventId}_anchors`);
      socket.join(`event:${eventId}:anchors`);
      socket.join(`event_${eventId}_anchor`);
      if (track) {
        socket.join(`event_${eventId}_anchor_${track}`);
        socket.join(`event_${eventId}_track_${track}`);
      }
    }

    if (track) {
      socket.join(`event_${eventId}_track_${track}`);
      socket.join(`event:${eventId}:track:${track}`);
    }

    logger.info(`Socket [${socket.id}] (${role || 'guest'}) joined event [${eventId}] track [${track || 'all'}]`);

    const confirmationPayload = {
      eventId,
      role: role || socket.userRole,
      track: track || socket.track,
      status: 'connected',
      socketId: socket.id
    };

    socket.emit('joinedEvent', confirmationPayload);
    socket.emit(SOCKET_EVENTS.ROOM_JOINED, confirmationPayload);
  };

  socket.on(SOCKET_EVENTS.JOIN_EVENT, handleJoin);
  socket.on('joinEvent', handleJoin);

  const handleJoinTrack = ({ eventId, track }) => {
    const targetEventId = eventId || socket.eventId;
    if (!targetEventId || !track) return;

    if (socket.currentTrack) {
      socket.leave(`event_${targetEventId}_track_${socket.currentTrack}`);
      socket.leave(`event:${targetEventId}:track:${socket.currentTrack}`);
    }

    socket.currentTrack = track;
    socket.track = track;
    socket.join(`event_${targetEventId}_track_${track}`);
    socket.join(`event:${targetEventId}:track:${track}`);

    logger.info(`Socket [${socket.id}] joined track [${track}] in event [${targetEventId}]`);

    const payload = { eventId: targetEventId, track, socketId: socket.id };
    socket.emit('joinedTrack', payload);
    socket.emit('track_joined', payload);
  };

  socket.on('joinTrack', handleJoinTrack);
  socket.on('join_track', handleJoinTrack);

  socket.on(SOCKET_EVENTS.LEAVE_EVENT, ({ eventId }) => {
    if (!eventId) return;
    socket.leave(`event_${eventId}`);
    socket.leave(`event:${eventId}`);
    socket.leave(`event_${eventId}_anchors`);
    socket.leave(`event_${eventId}_organizers`);
    logger.info(`Socket [${socket.id}] left room [event_${eventId}]`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: [${socket.id}]`);
  });
};
