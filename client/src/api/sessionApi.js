import axiosClient from './axiosClient';

export const sessionApi = {
  addSession: async (eventId, sessionData) => {
    const res = await axiosClient.post(`/events/${eventId}/sessions`, sessionData);
    return res.data;
  },

  triggerDelay: async (eventId, sessionId, delayMinutes, reason) => {
    const res = await axiosClient.post(
      `/events/${eventId}/sessions/${sessionId}/delay`,
      { delayMinutes, reason }
    );
    return res.data;
  },

  activateSession: async (eventId, sessionId) => {
    const res = await axiosClient.patch(`/events/${eventId}/sessions/${sessionId}/activate`);
    return res.data;
  },

  updateScript: async (eventId, sessionId, scriptType, content) => {
    const res = await axiosClient.patch(
      `/events/${eventId}/sessions/${sessionId}/script`,
      { scriptType, content }
    );
    return res.data;
  }
};
