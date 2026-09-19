import api from './api';
import { MOCK_EVENTS } from '../constants/mockData';

export const eventService = {
  /**
   * Fetch list of events
   */
  async getEvents() {
    try {
      return await api.get('/events');
    } catch (error) {
      console.warn('[eventService] Using mock events dataset.', error.message);
      return MOCK_EVENTS;
    }
  },

  /**
   * Fetch single event details by ID
   */
  async getEventById(eventId) {
    try {
      return await api.get(`/events/${eventId}`);
    } catch (error) {
      console.warn('[eventService] Using mock event details.', error.message);
      return MOCK_EVENTS.find((e) => e.id === eventId) || MOCK_EVENTS[0];
    }
  },

  /**
   * Create a new event
   */
  async createEvent(eventData) {
    try {
      return await api.post('/events', eventData);
    } catch (error) {
      console.warn('[eventService] Creating mock event fallback.', error.message);
      const newEvent = {
        id: `evt_${Date.now()}`,
        ...eventData,
        status: 'UPCOMING',
        totalAttendees: 0,
        timeDriftMinutes: 0,
      };
      return newEvent;
    }
  },

  /**
   * Update event live status or parameters
   */
  async updateEventStatus(eventId, status) {
    try {
      return await api.patch(`/events/${eventId}/status`, { status });
    } catch (error) {
      console.warn('[eventService] Updating mock event status fallback.', error.message);
      return { id: eventId, status, updatedAt: new Date().toISOString() };
    }
  },
};
