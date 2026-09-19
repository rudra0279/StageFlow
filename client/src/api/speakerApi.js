import axiosClient from './axiosClient';

export const speakerApi = {
  getSpeakers: async (eventId) => {
    const res = await axiosClient.get(`/speakers${eventId ? `?eventId=${eventId}` : ''}`);
    return res.data;
  },

  createSpeaker: async (speakerData) => {
    const res = await axiosClient.post('/speakers', speakerData);
    return res.data;
  },

  updateSpeaker: async (id, speakerData) => {
    const res = await axiosClient.patch(`/speakers/${id}`, speakerData);
    return res.data;
  },

  deleteSpeaker: async (id) => {
    const res = await axiosClient.delete(`/speakers/${id}`);
    return res.data;
  }
};
