import api from './api';
import { MOCK_USER_ORGANIZER, MOCK_USER_ANCHOR } from '../constants/mockData';

export const authService = {
  /**
   * Login user
   * @param {Object} credentials { email, password, role }
   */
  async login({ email, password, role = 'organizer' }) {
    try {
      // Endpoint placeholder for backend integration
      const data = await api.post('/auth/login', { email, password, role });
      if (data.token) {
        localStorage.setItem('stagepilot_token', data.token);
        localStorage.setItem('stagepilot_user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.warn('[authService] Backend endpoint unavailable, returning mock login response.', error.message);
      
      // Fallback mock authentication logic
      const user = role === 'anchor' ? MOCK_USER_ANCHOR : MOCK_USER_ORGANIZER;
      const mockToken = `mock_jwt_token_${user.role}_${Date.now()}`;
      
      localStorage.setItem('stagepilot_token', mockToken);
      localStorage.setItem('stagepilot_user', JSON.stringify(user));
      
      return {
        success: true,
        token: mockToken,
        user,
      };
    }
  },

  /**
   * Register new user
   */
  async register(userData) {
    try {
      const data = await api.post('/auth/register', userData);
      if (data.token) {
        localStorage.setItem('stagepilot_token', data.token);
        localStorage.setItem('stagepilot_user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.warn('[authService] Backend endpoint unavailable, returning mock registration response.', error.message);
      const newUser = {
        id: `usr_${Date.now()}`,
        name: userData.name || 'New Member',
        email: userData.email,
        role: userData.role || 'organizer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      };
      const mockToken = `mock_jwt_token_${newUser.role}_${Date.now()}`;
      localStorage.setItem('stagepilot_token', mockToken);
      localStorage.setItem('stagepilot_user', JSON.stringify(newUser));
      return {
        success: true,
        token: mockToken,
        user: newUser,
      };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('[authService] Logout backend fallback.', error.message);
    } finally {
      localStorage.removeItem('stagepilot_token');
      localStorage.removeItem('stagepilot_user');
    }
  },

  /**
   * Get current stored user session
   */
  getCurrentUser() {
    const userJson = localStorage.getItem('stagepilot_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },
};
