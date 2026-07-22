/** Auth store — manages user session, token, and role (Zustand) */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/types/api';

interface AuthState {
  token: string | null;
  role: UserRole | null;
  username: string | null;
  expiresAt: number | null;

  /** Whether the user is currently authenticated with a valid token */
  isAuthenticated: () => boolean;

  /** Whether the user has admin role */
  isAdmin: () => boolean;

  /** Login — store credentials from API response */
  login: (token: string, role: UserRole, username: string, expiresIn: number) => void;

  /** Logout — clear all session data */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      username: null,
      expiresAt: null,

      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return Date.now() < expiresAt;
      },

      isAdmin: () => get().role === 'admin',

      login: (token, role, username, expiresIn) => {
        set({
          token,
          role,
          username,
          expiresAt: Date.now() + expiresIn * 1000,
        });
      },

      logout: () => {
        set({
          token: null,
          role: null,
          username: null,
          expiresAt: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist token, role, username, expiresAt
      partialize: (state) => ({
        token: state.token,
        role: state.role,
        username: state.username,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
