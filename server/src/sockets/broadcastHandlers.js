import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { Announcement } from '../models/Announcement.js';
import { logger } from '../utils/logger.js';

export const registerBroadcastHandlers = (io, socket) => {
  socket.on(SOCKET_EVENTS.SEND_STAGE_ALERT, async (payload) => {
    try {
      const { eventId, message, urgency, type } = payload;
      logger.info(`Broadcast alert received: "${message}" (${urgency})`);

      const announcement = await Announcement.create({
        eventId,
        message,
        urgency: urgency || 'MEDIUM',
        type: type || 'GENERAL',
        senderRole: socket.userRole || 'ORGANIZER'
      });

      // Broadcast immediately to the room
      io.to(`event_${eventId}`).emit(SOCKET_EVENTS.STAGE_ALERT, {
        id: announcement._id,
        eventId,
        message,
        urgency: announcement.urgency,
        type: announcement.type,
        timestamp: announcement.createdAt
      });
    } catch (err) {
      logger.error(`Error broadcasting alert: ${err.message}`);
    }
  });

  socket.on(SOCKET_EVENTS.DISMISS_ALERT, async ({ alertId }) => {
    try {
      await Announcement.findByIdAndUpdate(alertId, { isDismissed: true });
    } catch (err) {
      logger.error(`Error dismissing alert: ${err.message}`);
    }
  });
};
