import axiosClient from './axiosClient';

export const authApi = {
  login: async (credentials) => {
    const res = await axiosClient.post('/auth/login', credentials);
    return res.data;
  },

  register: async (userData) => {
    const res = await axiosClient.post('/auth/register', userData);
    return res.data;
  },

  getMe: async () => {
    const res = await axiosClient.get('/auth/me');
    return res.data;
  },

  verifyInviteCode: async (code) => {
    const res = await axiosClient.post('/auth/verify-code', { code });
    return res.data;
  }
};
