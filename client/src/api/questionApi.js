import { axiosClient } from './axiosClient';

export const questionApi = {
  submitQuestion: async (eventId, data) => {
    const res = await axiosClient.post(`/events/${eventId}/questions`, data);
    return res.data;
  },

  getQuestions: async (eventId, params = {}) => {
    const res = await axiosClient.get(`/events/${eventId}/questions`, { params });
    return res.data;
  },

  getAnchorFeed: async (eventId, track) => {
    const params = track ? { track } : {};
    const res = await axiosClient.get(`/events/${eventId}/questions/anchor`, { params });
    return res.data;
  },

  approveQuestion: async (eventId, questionId) => {
    const res = await axiosClient.patch(`/events/${eventId}/questions/${questionId}/approve`);
    return res.data;
  },

  rejectQuestion: async (eventId, questionId) => {
    const res = await axiosClient.patch(`/events/${eventId}/questions/${questionId}/reject`);
    return res.data;
  },

  answerQuestion: async (eventId, questionId) => {
    const res = await axiosClient.patch(`/events/${eventId}/questions/${questionId}/answer`);
    return res.data;
  },

  upvoteQuestion: async (eventId, questionId, voterId) => {
    const res = await axiosClient.post(`/events/${eventId}/questions/${questionId}/upvote`, { voterId });
    return res.data;
  },

  getAiQuestionAssist: async (data) => {
    const res = await axiosClient.post('/ai/question-assist', data);
    return res.data;
  }
};
