import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, ApiError, type AuthUser } from "../lib/api";
import type { Role } from "./types";

interface AppState {
  role: Role | null;
  token: string | null;
  user: AuthUser | null;
  authLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  setSessionFromToken: (token: string) => Promise<void>;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: null,
      token: null,
      user: null,
      authLoading: false,
      authError: null,
      login: async (email, password) => {
        set({ authLoading: true, authError: null });
        try {
          const { token, user } = await api.login(email, password);
          set({ token, user, role: user.role, authLoading: false });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Could not sign in. Please try again.";
          set({ authLoading: false, authError: message });
          throw err;
        }
      },
      loginWithGoogle: () => {
        window.location.href = api.googleLoginUrl();
      },
      setSessionFromToken: async (token) => {
        set({ authLoading: true, authError: null });
        try {
          const { user } = await api.me(token);
          set({ token, user, role: user.role, authLoading: false });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Could not verify Google sign-in.";
          set({ authLoading: false, authError: message, token: null, user: null, role: null });
          throw err;
        }
      },
      logout: () => {
        const token = get().token;
        if (token) api.logout(token).catch(() => {});
        set({ role: null, token: null, user: null, authError: null });
      },
    }),
    {
      name: "ceo-pa-auth",
      partialize: (s) => ({ token: s.token, user: s.user, role: s.role }),
    }
  )
);
