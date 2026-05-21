import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../api/client";
import type { User } from "../types";

type SessionState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginDemo: (name: string) => Promise<void>;
  signOut: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      async loginWithGoogle(credential) {
        set({ isLoading: true, error: null });

        try {
          const session = await apiClient.loginWithGoogle(credential);
          set({ user: session.user, token: session.token, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Could not sign in with Google",
          });
        }
      },

      async loginDemo(name) {
        set({ isLoading: true, error: null });

        try {
          const session = await apiClient.loginDemo(name);
          set({ user: session.user, token: session.token, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Could not sign in",
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
