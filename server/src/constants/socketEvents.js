export const SOCKET_EVENTS = {
  // Connection / Rooms
  JOIN_EVENT: 'join_event',
  LEAVE_EVENT: 'leave_event',
  ROOM_JOINED: 'room_joined',

  // Session & Agenda Lifecycle
  TRIGGER_DELAY: 'trigger_delay',
  START_SESSION: 'start_session',
  COMPLETE_SESSION: 'complete_session',
  REORDER_SESSIONS: 'reorder_sessions',
  AGENDA_UPDATED: 'agenda_updated',
  SESSION_STARTED: 'session_started',
  SESSION_ACTIVATED: 'session_activated',
  DELAY_BROADCAST: 'delay_broadcast',

  // Announcements & Alerts
  SEND_STAGE_ALERT: 'send_stage_alert',
  STAGE_ALERT: 'stage_alert',
  ANNOUNCEMENT_RECEIVED: 'announcement_received',
  DISMISS_ALERT: 'dismiss_alert',

  // Speech & Teleprompter Tracking (Stage 1 Live Speech-to-Text)
  SPEECH_PROGRESS: 'speech_progress',

  // AI Script Sync
  AI_SCRIPT_READY: 'ai_script_ready',
  REQUEST_AI_SCRIPT: 'request_ai_script',

  // Health Updates
  HEALTH_STATUS_CHANGED: 'health_status_changed'
};
