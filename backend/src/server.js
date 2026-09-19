import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  // 1. Establish MongoDB connection
  await connectDB();

  // 2. Start HTTP server
  const server = app.listen(ENV.PORT, () => {
    logger.info(`===============================================`);
    logger.info(`🚀 StagePilot Backend Foundation Running`);
    logger.info(`📡 Listening on Port: ${ENV.PORT}`);
    logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
    logger.info(`🏥 Health Check: http://localhost:${ENV.PORT}/api/health`);
    logger.info(`===============================================`);
  });

  // Graceful shutdown handling
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
  logger.error('Server startup failed:', err);
});
