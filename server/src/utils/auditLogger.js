/**
 * Security Audit Activity Logger
 * Records sensitive security and operational events with strict redaction.
 */
const auditHistory = [];
const MAX_AUDIT_RECORDS = 500;

export const AUDIT_EVENT_TYPES = {
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE: 'AUTH_LOGIN_FAILURE',
  AUTH_REGISTER_SUCCESS: 'AUTH_REGISTER_SUCCESS',
  AUTH_REGISTER_FAILURE: 'AUTH_REGISTER_FAILURE',
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_STATUS_CHANGED: 'EVENT_STATUS_CHANGED',
  SESSION_DELAYED: 'SESSION_DELAYED',
  SESSION_ACTIVATED: 'SESSION_ACTIVATED',
  BROADCAST_SENT: 'BROADCAST_SENT',
  QUESTION_MODERATED: 'QUESTION_MODERATED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
};

/**
 * Log a security or critical operational event.
 * Passwords, tokens, and credentials MUST NEVER be included in metadata.
 */
export const logAuditEvent = ({
  eventType,
  userId = null,
  userEmail = null,
  role = 'GUEST',
  ip = null,
  eventId = null,
  sessionId = null,
  details = {},
  success = true
}) => {
  // Scrub any accidental sensitive fields in details
  const safeDetails = { ...details };
  delete safeDetails.password;
  delete safeDetails.token;
  delete safeDetails.jwt;
  delete safeDetails.secret;

  const record = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    eventType,
    timestamp: new Date().toISOString(),
    success,
    userId: userId ? String(userId) : null,
    userEmail: userEmail ? String(userEmail) : null,
    role,
    ip: ip || 'internal',
    eventId: eventId ? String(eventId) : null,
    sessionId: sessionId ? String(sessionId) : null,
    details: safeDetails
  };

  auditHistory.push(record);
  if (auditHistory.length > MAX_AUDIT_RECORDS) {
    auditHistory.shift();
  }

  return record;
};

export const getAuditLogs = (limit = 50) => {
  return auditHistory.slice(-limit).reverse();
};

export const clearAuditLogs = () => {
  auditHistory.length = 0;
};
