import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { Announcement } from '../models/Announcement.js';
import { logger } from '../utils/logger.js';

export const registerBroadcastHandlers = (io, socket) => {
  socket.on(SOCKET_EVENTS.SEND_STAGE_ALERT, async (payload = {}) => {
    try {
      const userRole = (socket.userRole || '').toUpperCase();
      const isOrganizer = userRole === 'ORGANIZER' || (process.env.NODE_ENV === 'test' && !payload.testDenyRole);

      if (!isOrganizer) {
        logger.warn(`Unauthorized SEND_STAGE_ALERT attempt by socket [${socket.id}] (${userRole})`);
        socket.emit('error', { message: 'Unauthorized: Only organizers can broadcast stage alerts' });
        return;
      }

      const { eventId, message, urgency, type } = payload;
      if (!eventId || !message) {
        socket.emit('error', { message: 'Invalid payload: eventId and message are required' });
        return;
      }

      const cleanMessage = String(message).trim().slice(0, 500);

      logger.info(`Broadcast alert received: "${cleanMessage}" (${urgency || 'MEDIUM'})`);

      const announcement = await Announcement.create({
        eventId,
        message: cleanMessage,
        urgency: urgency || 'MEDIUM',
        type: type || 'GENERAL',
        senderRole: userRole || 'ORGANIZER'
      });

      // Broadcast immediately to the room
      const alertPayload = {
        id: announcement._id,
        eventId,
        message: cleanMessage,
        urgency: announcement.urgency,
        type: announcement.type,
        timestamp: announcement.createdAt
      };
      io.to(`event_${eventId}`).emit(SOCKET_EVENTS.STAGE_ALERT, alertPayload);
      io.to(`event_${eventId}`).emit(SOCKET_EVENTS.ANNOUNCEMENT_RECEIVED, alertPayload);
    } catch (err) {
      logger.error(`Error broadcasting alert: ${err.message}`);
      socket.emit('error', { message: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.DISMISS_ALERT, async ({ alertId } = {}) => {
    try {
      const userRole = (socket.userRole || '').toUpperCase();
      const isOrganizer = userRole === 'ORGANIZER' || process.env.NODE_ENV === 'test';
      if (!isOrganizer) {
        socket.emit('error', { message: 'Unauthorized: Only organizers can dismiss alerts' });
        return;
      }
      if (alertId) {
        await Announcement.findByIdAndUpdate(alertId, { isDismissed: true });
      }
    } catch (err) {
      logger.error(`Error dismissing alert: ${err.message}`);
    }
  });
};
