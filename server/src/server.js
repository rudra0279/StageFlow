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

  // 5. Start listening with automatic port fallback if occupied
  let port = Number(ENV.PORT) || 5001;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  const listen = (currentPort) => {
    // Guard: don't try to listen if already listening
    if (httpServer.listening) {
      return;
    }
    httpServer.listen(currentPort, () => {
      logger.info(`=========================================`);
      logger.info(`🚀 StagePilot Server running on port ${currentPort}`);
      logger.info(`📡 Socket.IO listening on port ${currentPort}`);
      logger.info(`🌐 Frontend URL: ${ENV.CLIENT_URL}`);
      logger.info(`🤖 AI Provider: ${ENV.AI_PROVIDER.toUpperCase()}`);
      logger.info(`=========================================`);
    });
  };

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts < MAX_ATTEMPTS) {
      attempts += 1;
      logger.warn(`Port ${port} is in use. Retrying on port ${port + 1}... (attempt ${attempts}/${MAX_ATTEMPTS})`);
      // Close the server cleanly before re-binding
      httpServer.closeAllConnections?.();
      port += 1;
      setTimeout(() => listen(port), 500);
    } else {
      logger.error('Server error:', err);
      process.exit(1);
    }
  });

  listen(port);

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    httpServer.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => process.exit(0));
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
});
