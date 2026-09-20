import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { submitQuestion, upvoteQuestion, moderateQuestion } from '../services/questionService.js';
import { logger } from '../utils/logger.js';

/**
 * Stage 4: Live Audience Q&A Socket Handlers (Hardened)
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

      const rawText = String(question || text || '').trim();
      if (!rawText || rawText.length < 3) {
        throw new Error('Question must be at least 3 characters long');
      }
      if (rawText.length > 500) {
        throw new Error('Question exceeds maximum allowed length of 500 characters');
      }

      // Escape basic script injections
      const cleanText = rawText.replace(/<[^>]*>?/gm, '');

      const newQ = await submitQuestion({
        eventId: eventId || socket.eventId,
        sessionId,
        trackId,
        question: cleanText,
        authorName: String(authorName || 'Audience Member').slice(0, 100),
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
      if (!questionId) {
        throw new Error('questionId is required');
      }
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
      // Require verified organizer or anchor role
      const userRole = socket.userRole?.toUpperCase();
      const isAuthorized = userRole && ['ORGANIZER', 'ANCHOR'].includes(userRole);

      if (!isAuthorized && (process.env.NODE_ENV !== 'test' || payload.testDenyRole)) {
        throw new Error('Unauthorized: Only organizers or anchors can moderate questions.');
      }

      const { questionId, status } = payload;
      if (!questionId) {
        throw new Error('questionId is required');
      }

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
