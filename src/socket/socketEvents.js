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
    TASK_CREATED: 'task_created',
    TASK_ASSIGNED: 'task_assigned',
    TASK_UPDATED: 'task_updated',
    TASK_COMPLETED: 'task_completed',
    TASK_DELETED: 'task_deleted',
    ORGANIZER_CHAT_MESSAGE: 'organizer_chat_message',
    CHAT_MESSAGE: 'chat_message',
  },
  getEventRoom: (eventId) => `event:${eventId}`,
  getOrganizerChatRoom: (eventId) => `event:${eventId}:organizer-chat`,
};
