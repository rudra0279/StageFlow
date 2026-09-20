import api from './api';
import { MOCK_AGENDA } from '../constants/mockData';

export const agendaService = {
  /**
   * Fetch agenda timeline items for event
   */
  async getAgenda(eventId) {
    try {
      return await api.get(`/events/${eventId}/agenda`);
    } catch (error) {
      console.warn('[agendaService] Using mock agenda timeline.', error.message);
      return MOCK_AGENDA;
    }
  },

  /**
   * Update agenda item status or timing
   */
  async updateAgendaItem(agendaId, updates) {
    try {
      return await api.patch(`/agenda/${agendaId}`, updates);
    } catch (error) {
      console.warn('[agendaService] Mock updating agenda item.', error.message);
      return { id: agendaId, ...updates };
    }
  },

  /**
   * Shift agenda timeline by minutes (+1 or -1 mins adjustment)
   */
  async adjustTimelineDrift(eventId, deltaMinutes) {
    try {
      return await api.post(`/events/${eventId}/adjust-drift`, { deltaMinutes });
    } catch (error) {
      console.warn('[agendaService] Mock adjusting timeline drift.', error.message);
      return { eventId, deltaMinutes, newDrift: deltaMinutes };
    }
  },
};
