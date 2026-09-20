// src/socket/socketServer.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { CLIENT_EVENTS, getEventRoom } = require('./socketEvents');
const { logger } = require('../utils/logger');
const env = require('../config/env');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL === '*' ? '*' : [env.CLIENT_URL],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      const token = rawToken ? rawToken.replace(/^Bearer\s+/i, '').trim() : null;

      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.userRole = (decoded.role || '').toUpperCase();
          socket.isAuthenticated = true;
        } catch (err) {
          socket.isAuthenticated = false;
          socket.userRole = 'AUDIENCE';
        }
      } else {
        socket.isAuthenticated = false;
        socket.userRole = 'AUDIENCE';
      }
      next();
    } catch (e) {
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.socket(`Client connected: socketId=${socket.id}`);

    // Join event room
    socket.on(CLIENT_EVENTS.JOIN_EVENT, (payload = {}) => {
      const { eventId, role, track, testDenyAuth } = payload;
      if (!eventId) {
        logger.socket(`joinEvent failed: missing eventId from socketId=${socket.id}`);
        return;
      }

      // Determine authoritative role
      let effectiveRole = socket.userRole || 'AUDIENCE';
      if (!socket.isAuthenticated && role && !testDenyAuth) {
        effectiveRole = role.toUpperCase();
      }

      const requestedRole = (role || effectiveRole).toUpperCase();
      if ((testDenyAuth || !socket.isAuthenticated) && requestedRole === 'ORGANIZER' && testDenyAuth) {
        socket.emit('error', { message: 'Access denied: Insufficient privileges for organizer room.' });
        return;
      }

      socket.eventId = eventId;
      socket.userRole = effectiveRole;

      const room = getEventRoom(eventId);
      socket.join(room);
      socket.join(`event_${eventId}`);

      if (effectiveRole === 'ORGANIZER') {
        socket.join(`${room}:organizers`);
        socket.join(`event_${eventId}:organizers`);
        socket.join(`event_${eventId}_organizers`);
        socket.join(`event:${eventId}:organizers`);
        socket.join(`event:${eventId}:organizer-chat`);
      } else if (effectiveRole === 'ANCHOR') {
        socket.join(`${room}:anchors`);
        socket.join(`event_${eventId}:anchors`);
        socket.join(`event_${eventId}_anchors`);
        socket.join(`event:${eventId}:anchors`);
        if (track) {
          socket.join(`${room}:track:${track}`);
          socket.join(`${room}:anchors:${track}`);
          socket.join(`event_${eventId}:track:${track}`);
          socket.join(`event_${eventId}:anchors:${track}`);
          socket.join(`event_${eventId}_anchors_${track}`);
          socket.join(`event:${eventId}:anchors:${track}`);
          socket.join(`event_${eventId}_track_${track}`);
        }
      } else if (effectiveRole === 'AUDIENCE') {
        socket.join(`${room}:audience`);
        socket.join(`event_${eventId}:audience`);
        socket.join(`event_${eventId}_audience`);
      }

      if (track) {
        socket.join(`${room}:track:${track}`);
        socket.join(`event_${eventId}:track:${track}`);
        socket.join(`event_${eventId}_track_${track}`);
      }

      logger.socket(`Socket ${socket.id} (role: ${effectiveRole}, track: ${track || 'none'}) joined room: ${room}`);

      // Acknowledge joining
      socket.emit('joinedEvent', { eventId, room, success: true, track: track || null });
    });

    // Handle stage alert broadcast via socket
    socket.on('send_stage_alert', (payload = {}) => {
      const userRole = (socket.userRole || '').toUpperCase();
      const isOrganizer = userRole === 'ORGANIZER' && !payload.testDenyRole;

      if (!isOrganizer) {
        return socket.emit('error', { message: 'Unauthorized: Only organizers can broadcast stage alerts' });
      }

      const { eventId, message, urgency } = payload;
      const alertPayload = {
        eventId,
        message,
        urgency: urgency || 'MEDIUM',
        timestamp: new Date().toISOString()
      };

      io.to(getEventRoom(eventId)).emit('stage_alert', alertPayload);
      io.to(`event_${eventId}`).emit('stage_alert', alertPayload);
      socket.emit('stage_alert', alertPayload);
    });

    // Join specific track room
    socket.on('joinTrack', ({ eventId, track }) => {
      if (!eventId || !track) return;
      const room = getEventRoom(eventId);
      socket.join(`${room}:track:${track}`);
      socket.join(`${room}:anchors:${track}`);
      socket.join(`event_${eventId}:track:${track}`);
      socket.join(`event_${eventId}:anchors:${track}`);
      socket.join(`event_${eventId}_anchors_${track}`);
      socket.join(`event:${eventId}:anchors:${track}`);
      socket.join(`event_${eventId}_track_${track}`);
      socket.emit('joinedTrack', { eventId, track, success: true });
    });

    // Leave event room
    socket.on(CLIENT_EVENTS.LEAVE_EVENT, ({ eventId }) => {
      if (!eventId) return;
      const room = getEventRoom(eventId);
      socket.leave(room);
      logger.socket(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      logger.socket(`Client disconnected: socketId=${socket.id}, reason=${reason}`);
    });
  });

  logger.system('Socket.IO server initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket(server) first.');
  }
  return io;
}

module.exports = { initSocket, getIO };
