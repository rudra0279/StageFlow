import api from './api';
import { MOCK_SPEAKERS } from '../constants/mockData';

export const speakerService = {
  /**
   * Fetch all speakers for an event
   */
  async getSpeakers(eventId) {
    try {
      return await api.get(`/events/${eventId}/speakers`);
    } catch (error) {
      console.warn('[speakerService] Using mock speakers.', error.message);
      return MOCK_SPEAKERS;
    }
  },

  /**
   * Update speaker stage readiness status (READY, ON STAGE, COMPLETED)
   */
  async updateSpeakerStatus(speakerId, status) {
    try {
      return await api.patch(`/speakers/${speakerId}/status`, { status });
    } catch (error) {
      console.warn('[speakerService] Mock updating speaker status.', error.message);
      return { id: speakerId, status, updatedAt: new Date().toISOString() };
    }
  },

  /**
   * Create speaker record
   */
  async addSpeaker(speakerData) {
    try {
      return await api.post('/speakers', speakerData);
    } catch (error) {
      console.warn('[speakerService] Mock adding speaker.', error.message);
      return {
        id: `spk_${Date.now()}`,
        ...speakerData,
        status: 'READY',
        slidesReady: true,
      };
    }
  },
};
