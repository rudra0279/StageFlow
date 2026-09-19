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

export const logger = {
  info: (msg, meta = {}) => {
    const clean = Object.keys(meta).length ? redactSensitive(meta) : '';
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, clean);
  },
  warn: (msg, meta = {}) => {
    const clean = Object.keys(meta).length ? redactSensitive(meta) : '';
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, clean);
  },
  error: (msg, err = null) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, err ? err.stack || err : '');
  },
  socket: (event, room, payload = {}) => {
    const clean = Object.keys(payload).length ? redactSensitive(payload) : {};
    console.log(`[SOCKET] -> [${event}] in room [${room}]`, clean);
  }
};
