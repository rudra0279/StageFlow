import axiosClient from './axiosClient';

export const aiApi = {
  generateScript: async ({ eventId, sessionId, scriptType, tone, customParams }) => {
    const res = await axiosClient.post('/ai/generate-script', {
      eventId,
      sessionId,
      scriptType,
      tone,
      customParams
    });
    return res.data;
  },

  askCopilot: async ({ eventId, sessionId, track, query }) => {
    const res = await axiosClient.post('/ai/copilot-query', {
      eventId,
      sessionId,
      track,
      query
    });
    return res.data;
  }
};
