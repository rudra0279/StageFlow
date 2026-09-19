import { registerRoomHandlers } from './roomManager.js';
import { registerAgendaHandlers } from './agendaHandlers.js';
import { registerBroadcastHandlers } from './broadcastHandlers.js';
import { logger } from '../utils/logger.js';

export const setupSockets = (io) => {
  io.on('connection', (socket) => {
    logger.info(`New client connected to Socket.IO: [${socket.id}]`);

    registerRoomHandlers(io, socket);
    registerAgendaHandlers(io, socket);
    registerBroadcastHandlers(io, socket);
  });
};
