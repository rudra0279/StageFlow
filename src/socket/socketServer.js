// src/socket/socketServer.js
const { Server } = require('socket.io');
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

  io.on('connection', (socket) => {
    logger.socket(`Client connected: socketId=${socket.id}`);

    // Join event room
    socket.on(CLIENT_EVENTS.JOIN_EVENT, ({ eventId, role, track }) => {
      if (!eventId) {
        logger.socket(`joinEvent failed: missing eventId from socketId=${socket.id}`);
        return;
      }
      const room = getEventRoom(eventId);
      socket.join(room);

      // Also join role-specific and track-specific rooms
      const normalizedRole = (role || '').toUpperCase();
      if (normalizedRole === 'ORGANIZER') {
        socket.join(`${room}:organizers`);
      } else if (normalizedRole === 'ANCHOR') {
        socket.join(`${room}:anchors`);
        if (track) {
          socket.join(`${room}:track:${track}`);
        }
      } else if (normalizedRole === 'AUDIENCE') {
        socket.join(`${room}:audience`);
      }

      logger.socket(`Socket ${socket.id} (role: ${role || 'guest'}, track: ${track || 'none'}) joined room: ${room}`);

      // Acknowledge joining
      socket.emit('joinedEvent', { eventId, room, success: true, track });
    });

    // Join specific track room
    socket.on('joinTrack', ({ eventId, track }) => {
      if (!eventId || !track) return;
      const room = getEventRoom(eventId);
      socket.join(`${room}:track:${track}`);
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
