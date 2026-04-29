import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../api/client";
import type { User } from "../types";

type SessionState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  signIn: (name: string, password: string) => Promise<void>;
  signUp: (name: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      async signIn(name, password) {
        set({ isLoading: true, error: null });

        try {
          const session = await apiClient.login(name, password);
          set({ user: session.user, token: session.token, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Could not sign in",
          });
        }
      },

      async signUp(name, password) {
        set({ isLoading: true, error: null });

        try {
          const session = await apiClient.register(name, password);
          set({ user: session.user, token: session.token, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Could not create account",
          });
        }
      },

      signOut() {
        set({ user: null, token: null, error: null, isLoading: false });
      },
    }),
    {
      name: "events-hub-session",
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
