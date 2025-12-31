import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  role: string;
  subscriptionTier: string;
  tokenBalance: number;
  referralCode: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateTokenBalance: (balance: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      signIn: async (email, password) => {
        const result = await api.signIn({ email, password });
        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      signUp: async (email, password, displayName) => {
        const result = await api.signUp({ email, password, displayName });
        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      signOut: async () => {
        await api.signOut();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      checkAuth: async () => {
        try {
          if (!api.getToken()) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
          const result = await api.getMe();
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          api.setToken(null);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateTokenBalance: (balance) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, tokenBalance: balance } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
