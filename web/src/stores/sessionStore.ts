import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../api/client";
import type { User } from "../types";

type SessionState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (name: string) => Promise<void>;
  signOut: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      async signIn(name) {
        set({ isLoading: true, error: null });

        try {
          const user = await apiClient.createDemoUser(name);
          set({ user, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Could not sign in",
          });
        }
      },

      signOut() {
        set({ user: null, error: null, isLoading: false });
      },
    }),
    {
      name: "events-hub-session",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
