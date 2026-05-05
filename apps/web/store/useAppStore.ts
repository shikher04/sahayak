/**
 * Global app state (non-server-state).
 * Server data lives in React Query; this store holds UI and session state.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@sahayak/shared-types";

interface AppState {
  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // User preferences
  preferredLanguage: string;
  setPreferredLanguage: (lang: string) => void;

  // Local profile cache (synced with backend on login)
  localProfile: Partial<UserProfile>;
  setLocalProfile: (profile: Partial<UserProfile>) => void;
  clearLocalProfile: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      preferredLanguage: "en",
      setPreferredLanguage: (lang) => set({ preferredLanguage: lang }),

      localProfile: {},
      setLocalProfile: (profile) => set({ localProfile: profile }),
      clearLocalProfile: () => set({ localProfile: {} }),
    }),
    {
      name: "sahayak-app-state",
      partialize: (state) => ({
        preferredLanguage: state.preferredLanguage,
        localProfile: state.localProfile,
      }),
    }
  )
);
