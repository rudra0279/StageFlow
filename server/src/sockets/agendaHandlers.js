import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { applySessionDelay } from '../services/eventService.js';
import { startLiveSession } from '../services/sessionService.js';
import { logger } from '../utils/logger.js';

export const registerAgendaHandlers = (io, socket) => {
  // Direct socket delay trigger
  socket.on(SOCKET_EVENTS.TRIGGER_DELAY, async (payload) => {
    try {
      const { eventId, sessionId, delayMinutes, reason } = payload;
      logger.info(`Socket trigger_delay received for session ${sessionId} (+${delayMinutes}m)`);
      await applySessionDelay(eventId, sessionId, Number(delayMinutes), reason);
    } catch (err) {
      logger.error(`Error processing socket trigger_delay: ${err.message}`);
      socket.emit('error', { message: err.message });
    }
  });

  // Direct socket session start
  socket.on(SOCKET_EVENTS.START_SESSION, async (payload) => {
    try {
      const { eventId, sessionId } = payload;
      logger.info(`Socket start_session received for session ${sessionId}`);
      await startLiveSession(eventId, sessionId);
    } catch (err) {
      logger.error(`Error processing socket start_session: ${err.message}`);
      socket.emit('error', { message: err.message });
    }
  });
};
