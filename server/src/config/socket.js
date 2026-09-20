import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket.IO Handshake Authentication Middleware
  ioInstance.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      const token = rawToken ? rawToken.replace(/^Bearer\s+/i, '').trim() : null;

      if (token) {
        try {
          const decoded = jwt.verify(token, ENV.JWT_SECRET);
          socket.userId = decoded.id;
          socket.userRole = (decoded.role || '').toUpperCase();
          socket.isAuthenticated = true;
          logger.info(`Socket [${socket.id}] authenticated as [${socket.userRole}] (User: ${socket.userId})`);
        } catch (tokenErr) {
          logger.warn(`Socket [${socket.id}] authentication failed: ${tokenErr.message}`);
          socket.isAuthenticated = false;
          socket.userRole = 'AUDIENCE';
        }
      } else {
        socket.isAuthenticated = false;
        socket.userRole = 'AUDIENCE';
      }

      next();
    } catch (err) {
      logger.error(`Socket auth middleware error: ${err.message}`);
      next();
    }
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return ioInstance;
};
