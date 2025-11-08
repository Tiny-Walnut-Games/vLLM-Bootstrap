import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  verifyAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.login(username, password);
      const user = await apiClient.verifyToken();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.register(username, password);
      const user = await apiClient.verifyToken();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    apiClient.logout();
    set({ user: null, error: null });
  },

  verifyAuth: async () => {
    if (!apiClient.isAuthenticated()) {
      return;
    }

    set({ isLoading: true });
    try {
      const user = await apiClient.verifyToken();
      set({ user, isLoading: false });
    } catch (error) {
      apiClient.clearTokens();
      set({ user: null, isLoading: false });
    }
  }
}));
