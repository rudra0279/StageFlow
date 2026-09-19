import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { logger } from '../utils/logger.js';

/**
 * Stage 1: Live Speech-to-Text Teleprompter Socket Handlers
 * 
 * Minimal real-time speech progress relay from the anchor's browser-based Web Speech API.
 * Broadcasts live telemetry (scroll progress, word index, speaking pace WPM) to
 * organizer war-room mirrors without heavy database write thrashing.
 */
export const registerTeleprompterHandlers = (io, socket) => {
  socket.on(SOCKET_EVENTS.SPEECH_PROGRESS, (payload = {}) => {
    try {
      const {
        eventId,
        sessionId,
        progressPercent = 0,
        currentWordIndex = 0,
        paceWpm = 0,
        transcriptSnippet = ''
      } = payload;

      if (!eventId) return;

      // Broadcast ephemeral progress to the event room (e.g., organizer dashboard / stage mirror)
      socket.to(`event_${eventId}`).emit(SOCKET_EVENTS.SPEECH_PROGRESS, {
        eventId,
        sessionId,
        progressPercent: Number(progressPercent),
        currentWordIndex: Number(currentWordIndex),
        paceWpm: Number(paceWpm),
        transcriptSnippet: String(transcriptSnippet || '').slice(0, 200),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error(`Error relaying speech_progress: ${err.message}`);
    }
  });
};
