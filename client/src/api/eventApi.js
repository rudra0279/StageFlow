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
  },

  getCommittee: async (id) => {
    const res = await axiosClient.get(`/events/${id}/committee`);
    return res.data;
  },

  getTasks: async (id) => {
    const res = await axiosClient.get(`/events/${id}/tasks`);
    return res.data;
  },

  createTask: async (id, taskData) => {
    const res = await axiosClient.post(`/events/${id}/tasks`, taskData);
    return res.data;
  },

  updateTask: async (id, taskId, updates) => {
    const res = await axiosClient.patch(`/events/${id}/tasks/${taskId}`, updates);
    return res.data;
  },

  deleteTask: async (id, taskId) => {
    const res = await axiosClient.delete(`/events/${id}/tasks/${taskId}`);
    return res.data;
  },

  batchCreateTasks: async (id, tasks) => {
    const res = await axiosClient.post(`/events/${id}/tasks/batch`, { tasks });
    return res.data;
  },

  getMessages: async (id) => {
    const res = await axiosClient.get(`/events/${id}/messages`);
    return res.data;
  },

  sendMessage: async (id, messageData) => {
    const res = await axiosClient.post(`/events/${id}/messages`, messageData);
    return res.data;
  }
};
