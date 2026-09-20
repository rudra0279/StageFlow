import axiosClient from './axiosClient';

export const eventApi = {
  getEvents: async () => {
    const res = await axiosClient.get('/events');
    return res.data;
  },

  getEventById: async (id) => {
    const res = await axiosClient.get(`/events/${id}`);
    return res.data;
  },

  createEvent: async (eventData) => {
    const res = await axiosClient.post('/events', eventData);
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await axiosClient.patch(`/events/${id}/status`, { status });
    return res.data;
  },

  broadcastAlert: async (id, alertData) => {
    const res = await axiosClient.post(`/events/${id}/broadcast`, alertData);
    return res.data;
  },

  exportRunOfShowPdf: async (id) => {
    const res = await axiosClient.get(`/events/${id}/run-of-show`, {
      responseType: 'blob'
    });
    return res;
  }
};
