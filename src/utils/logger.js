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

function redactSensitive(obj, depth = 0) {
  if (!obj || depth > 5) return obj;
  if (typeof obj !== 'object') return obj;

  const sensitivePattern = /(password|token|apiKey|authorization|secret|credential|cookie|jwt)/i;

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitive(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(obj)) {
    if (sensitivePattern.test(key)) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = redactSensitive(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

function formatMessage(tag, message, meta) {
  const timestamp = new Date().toISOString();
  let metaStr = '';
  if (meta) {
    try {
      const sanitized = redactSensitive(JSON.parse(JSON.stringify(meta)));
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
