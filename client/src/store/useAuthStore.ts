import { create } from 'zustand';
import { authApi } from '../api/services';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

interface AuthStore {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<boolean>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'Invalid email or password.',
        isLoading: false
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await authApi.getMe();
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      localStorage.removeItem('token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.updateProfile(data);
      set({
        user: res.data.user,
        isLoading: false
      });
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to update user profile.',
        isLoading: false
      });
      return false;
    }
  },

  changePassword: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.changePassword(data);
      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to change password.';
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },

  clearError: () => set({ error: null })
}));
