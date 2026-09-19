import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { submitQuestion, upvoteQuestion, moderateQuestion } from '../services/questionService.js';
import { logger } from '../utils/logger.js';

/**
 * Stage 4: Live Audience Q&A Socket Handlers
 * 
 * Manages real-time audience question submissions, upvotes, and moderation status updates.
 * Leverages existing event room partitioning (event_${eventId}).
 */
export const registerQuestionHandlers = (io, socket) => {
  // Client submits question via socket
  socket.on('submit_question', async (payload = {}, callback) => {
    try {
      const { eventId, sessionId, trackId, question, text, authorName } = payload;
      const voterId = socket.userId || socket.id;

      const newQ = await submitQuestion({
        eventId: eventId || socket.eventId,
        sessionId,
        trackId,
        question: question || text,
        authorName,
        voterId
      });

      if (typeof callback === 'function') {
        callback({ success: true, data: newQ });
      }
    } catch (err) {
      logger.error(`Error processing socket submit_question: ${err.message}`);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      } else {
        socket.emit('error', { message: err.message });
      }
    }
  });

  // Audience upvotes question via socket
  socket.on('upvote_question', async (payload = {}, callback) => {
    try {
      const { questionId } = payload;
      const voterId = socket.userId || socket.id;

      const updated = await upvoteQuestion({
        questionId,
        voterId
      });

      if (typeof callback === 'function') {
        callback({ success: true, upvotes: updated.upvotes });
      }
    } catch (err) {
      logger.error(`Error processing socket upvote_question: ${err.message}`);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      } else {
        socket.emit('error', { message: err.message });
      }
    }
  });

  // Organizer or Anchor moderates question via socket
  socket.on('moderate_question', async (payload = {}, callback) => {
    try {
      // Require organizer or anchor role
      const userRole = socket.userRole?.toUpperCase();
      if (!userRole || !['ORGANIZER', 'ANCHOR'].includes(userRole)) {
        throw new Error('Unauthorized: Only organizers or anchors can moderate questions.');
      }

      const { questionId, status } = payload;
      const updated = await moderateQuestion({
        questionId,
        status,
        userId: socket.userId
      });

      if (typeof callback === 'function') {
        callback({ success: true, data: updated });
      }
    } catch (err) {
      logger.error(`Error processing socket moderate_question: ${err.message}`);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      } else {
        socket.emit('error', { message: err.message });
      }
    }
  });
};
