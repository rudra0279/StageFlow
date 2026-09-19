// src/socket/socketEvents.js
module.exports = {
  CLIENT_EVENTS: {
    JOIN_EVENT: 'joinEvent',
    LEAVE_EVENT: 'leaveEvent',
  },
  SERVER_EVENTS: {
    AGENDA_UPDATED: 'agendaUpdated',
    SESSION_STARTED: 'sessionStarted',
    SESSION_COMPLETED: 'sessionCompleted',
    SESSION_DELAYED: 'sessionDelayed',
    SESSION_SKIPPED: 'sessionSkipped',
    ANNOUNCEMENT_CREATED: 'announcementCreated',
    EVENT_STATE_CHANGED: 'eventStateChanged',
  },
  getEventRoom: (eventId) => `event:${eventId}`,
};
