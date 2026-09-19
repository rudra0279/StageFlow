// src/utils/logger.js
const TAGS = {
  SOCKET: '[SOCKET]',
  AI: '[AI]',
  EVENT: '[EVENT]',
  SESSION: '[SESSION]',
  ANNOUNCEMENT: '[ANNOUNCEMENT]',
  AUTH: '[AUTH]',
  SYSTEM: '[SYSTEM]'
};

function formatMessage(tag, message, meta) {
  const timestamp = new Date().toISOString();
  let metaStr = '';
  if (meta) {
    try {
      // Sanitize any potential sensitive fields
      const sanitized = JSON.parse(JSON.stringify(meta));
      const sensitiveKeys = ['password', 'token', 'apiKey', 'authorization', 'secret'];
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          sanitized[key] = '***REDACTED***';
        }
      }
      metaStr = ' ' + JSON.stringify(sanitized);
    } catch {
      // Ignore serialization issues
    }
  }
  return `${timestamp} ${tag} ${message}${metaStr}`;
}

const logger = {
  socket: (msg, meta) => console.log(formatMessage(TAGS.SOCKET, msg, meta)),
  ai: (msg, meta) => console.log(formatMessage(TAGS.AI, msg, meta)),
  event: (msg, meta) => console.log(formatMessage(TAGS.EVENT, msg, meta)),
  session: (msg, meta) => console.log(formatMessage(TAGS.SESSION, msg, meta)),
  announcement: (msg, meta) => console.log(formatMessage(TAGS.ANNOUNCEMENT, msg, meta)),
  auth: (msg, meta) => console.log(formatMessage(TAGS.AUTH, msg, meta)),
  system: (msg, meta) => console.log(formatMessage(TAGS.SYSTEM, msg, meta)),
  error: (tag, msg, err) => {
    const errMessage = err ? (err.message || String(err)) : '';
    console.error(formatMessage(tag || TAGS.SYSTEM, `ERROR: ${msg} - ${errMessage}`));
  }
};

module.exports = { logger, TAGS };
