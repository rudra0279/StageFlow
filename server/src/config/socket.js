import { Server } from 'socket.io';
import { ENV } from './env.js';

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

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return ioInstance;
};
