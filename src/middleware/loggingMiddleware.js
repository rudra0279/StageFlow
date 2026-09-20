// src/middleware/loggingMiddleware.js
const { logger } = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const url = req.originalUrl;
    let tag = '[SYSTEM]';

    if (url.includes('/api/ai')) tag = '[AI]';
    else if (url.includes('/sessions')) tag = '[SESSION]';
    else if (url.includes('/events')) tag = '[EVENT]';
    else if (url.includes('/announcements')) tag = '[ANNOUNCEMENT]';
    else if (url.includes('/auth')) tag = '[AUTH]';

    if (tag === '[AI]') logger.ai(`${req.method} ${url} ${res.statusCode} (${duration}ms)`);
    else if (tag === '[SESSION]') logger.session(`${req.method} ${url} ${res.statusCode} (${duration}ms)`);
    else if (tag === '[EVENT]') logger.event(`${req.method} ${url} ${res.statusCode} (${duration}ms)`);
    else if (tag === '[ANNOUNCEMENT]') logger.announcement(`${req.method} ${url} ${res.statusCode} (${duration}ms)`);
    else if (tag === '[AUTH]') logger.auth(`${req.method} ${url} ${res.statusCode} (${duration}ms)`);
    else logger.system(`${req.method} ${url} ${res.statusCode} (${duration}ms)`);
  });
  next();
}

module.exports = requestLogger;
