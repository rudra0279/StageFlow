// server.js
const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket/socketServer');
const { logger } = require('./src/utils/logger');

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

async function startServer() {
  try {
    // Attempt DB connection (logs if offline)
    await connectDB().catch((err) => {
      logger.error('[SYSTEM]', 'MongoDB failed to connect on startup. Running in standby mode.', err);
    });

    server.listen(env.PORT, () => {
      logger.system(`StagePilot Server running on http://localhost:${env.PORT} [env: ${env.NODE_ENV}]`);
      logger.socket(`Socket.IO listening on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('[SYSTEM]', 'Fatal server bootstrap error', error);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown(signal) {
  logger.system(`Received ${signal}. Gracefully shutting down...`);
  server.close(() => {
    logger.system('HTTP and Socket server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
