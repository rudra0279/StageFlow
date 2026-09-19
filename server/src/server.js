import http from 'http';
import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { setupSockets } from './sockets/index.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Create HTTP server with Express app
  const httpServer = http.createServer(app);

  // 3. Initialize Socket.IO
  const io = initSocket(httpServer);

  // 4. Setup event handlers & rooms
  setupSockets(io);

  // 5. Start listening
  const server = httpServer.listen(ENV.PORT, () => {
    logger.info(`=========================================`);
    logger.info(`🚀 StagePilot Server running on port ${ENV.PORT}`);
    logger.info(`📡 Socket.IO listening on port ${ENV.PORT}`);
    logger.info(`🌐 Frontend URL: ${ENV.CLIENT_URL}`);
    logger.info(`🤖 AI Provider: ${ENV.AI_PROVIDER.toUpperCase()}`);
    logger.info(`=========================================`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => process.exit(0));
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
});
