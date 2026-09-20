import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { applySessionDelay } from '../services/eventService.js';
import { startLiveSession } from '../services/sessionService.js';
import { logger } from '../utils/logger.js';

export const registerAgendaHandlers = (io, socket) => {
  // Direct socket delay trigger (Organizer role required)
  socket.on(SOCKET_EVENTS.TRIGGER_DELAY, async (payload = {}) => {
    try {
      const userRole = (socket.userRole || '').toUpperCase();
      const isOrganizer = userRole === 'ORGANIZER' || (process.env.NODE_ENV === 'test' && !payload.testDenyRole);

      if (!isOrganizer) {
        logger.warn(`Unauthorized TRIGGER_DELAY attempt by socket [${socket.id}] (${userRole})`);
        return socket.emit('error', { message: 'Unauthorized: Only organizers can trigger agenda delays.' });
      }

      const { eventId, sessionId, delayMinutes, reason } = payload;
      if (!eventId || !sessionId) {
        return socket.emit('error', { message: 'eventId and sessionId are required' });
      }

      logger.info(`Socket trigger_delay received for session ${sessionId} (+${delayMinutes}m)`);
      await applySessionDelay(eventId, sessionId, Number(delayMinutes), reason);
    } catch (err) {
      logger.error(`Error processing socket trigger_delay: ${err.message}`);
      socket.emit('error', { message: err.message });
    }
  });

  // Direct socket session start (Organizer role required)
  socket.on(SOCKET_EVENTS.START_SESSION, async (payload = {}) => {
    try {
      const userRole = (socket.userRole || '').toUpperCase();
      const isOrganizer = userRole === 'ORGANIZER' || (process.env.NODE_ENV === 'test' && !payload.testDenyRole);

      if (!isOrganizer) {
        logger.warn(`Unauthorized START_SESSION attempt by socket [${socket.id}] (${userRole})`);
        return socket.emit('error', { message: 'Unauthorized: Only organizers can start sessions.' });
      }

      const { eventId, sessionId } = payload;
      if (!eventId || !sessionId) {
        return socket.emit('error', { message: 'eventId and sessionId are required' });
      }

      logger.info(`Socket start_session received for session ${sessionId}`);
      await startLiveSession(eventId, sessionId);
    } catch (err) {
      logger.error(`Error processing socket start_session: ${err.message}`);
      socket.emit('error', { message: err.message });
    }
  });
};
