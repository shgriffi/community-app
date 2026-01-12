import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api/ApiClient';

interface User {
  id: string;
  email: string;
  name: string;
  membershipTier: 'free' | 'basic' | 'premium';
  storageQuota: number;
  storageUsed: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) => {
        apiClient.setAuthToken(token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        apiClient.setAuthToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
