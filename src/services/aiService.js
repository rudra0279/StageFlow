import api from './api';
import { MOCK_AI_SUGGESTIONS } from '../constants/mockData';

export const aiService = {
  /**
   * Fetch active live suggestions from StagePilot AI engine
   */
  async getLiveSuggestions(eventId) {
    try {
      return await api.get(`/ai/${eventId}/suggestions`);
    } catch (error) {
      console.warn('[aiService] Using mock AI suggestions telemetry.', error.message);
      return MOCK_AI_SUGGESTIONS;
    }
  },

  /**
   * Generate AI teleprompter script for given topic or speaker profile
   */
  async generateScript({ speakerName, topic, durationMinutes, tone = 'engaging' }) {
    try {
      return await api.post('/ai/generate-script', { speakerName, topic, durationMinutes, tone });
    } catch (error) {
      console.warn('[aiService] Mock generating script fallback.', error.message);
      return {
        script: `Ladies and gentlemen, let's welcome ${speakerName || 'our next speaker'} to discuss ${topic || 'groundbreaking innovations'}. Over the next ${durationMinutes || 15} minutes, we will explore key takeaways and future trends!`,
        suggestedHighlights: ['Opening Hook', 'Core Methodology', 'Call to Action'],
      };
    }
  },

  /**
   * Auto-generate cue card summary points
   */
  async generateCueCard(speakerId) {
    try {
      return await api.post(`/ai/cue-card/${speakerId}`);
    } catch (error) {
      console.warn('[aiService] Mock cue card fallback.', error.message);
      return {
        speakerId,
        introScript: 'Please give a warm welcome to our speaker on stage!',
        bulletPoints: [
          'Highlight top 3 performance metrics',
          'Ask crowd for live Q&A via QR code',
          'Signal 2-minute wrap-up icon when timer hits 02:00',
        ],
      };
    }
  },
};
