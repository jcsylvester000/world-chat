import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  markActive,
  findProfileById,
  findProfileByEmail,
  listProfiles,
  updateChatPrivacy,
  updateProfile,
} from "@/lib/data/services";
import { profiles } from "@/lib/data/mock-data";
import { genFriendCode } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface AuthState {
  user: Profile | null;
  loading: boolean;
  error: string | null;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (input: { email: string; password: string; username: string }) => Promise<boolean>;
  saveProfile: (
    patch: Partial<Pick<Profile, "username" | "defaultShowPrice" | "defaultShowAttachments">>
  ) => Promise<void>;
  savePrivacy: (
    patch: Partial<Pick<Profile, "chatVisibility" | "allowFriendRequests">>
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => void;
}

// Mock, frontend-only auth. Replace with a real auth API when the
// backend lands.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      async signIn(email) {
        set({ loading: true, error: null });
        const user = await findProfileByEmail(email.trim().toLowerCase());
        if (!user) {
          set({ loading: false, error: "No account found for that email." });
          return false;
        }
        if (!user.active) {
          set({ loading: false, error: "Your account has been deactivated. Please contact support." });
          return false;
        }
        await markActive(user.id);
        set({ user, loading: false });
        return true;
      },

      async signUp({ email, username }) {
        set({ loading: true, error: null });
        const normalized = email.trim().toLowerCase();
        const existing = await findProfileByEmail(normalized);
        if (existing) {
          set({ loading: false, error: "That email is already registered." });
          return false;
        }
        const user: Profile = {
          id: `u-${Math.random().toString(36).slice(2, 9)}`,
          email: normalized,
          username: username.trim() || normalized.split("@")[0],
          plan: "basic",
          isAdmin: false,
          defaultShowPrice: true,
          defaultShowAttachments: true,
          code: genFriendCode(),
          chatVisibility: "everyone",
          allowFriendRequests: true,
          active: true,
          planInterval: null,
          planRenewsAt: null,
          lastActiveAt: new Date().toISOString(),
        };
        profiles.push(user);
        await listProfiles();
        set({ user, loading: false });
        return true;
      },

      async saveProfile(patch) {
        const current = get().user;
        if (!current) return;
        const updated = await updateProfile(current.id, patch);
        if (updated) set({ user: { ...current, ...updated } });
      },

      async savePrivacy(patch) {
        const current = get().user;
        if (!current) return;
        const updated = await updateChatPrivacy(current.id, patch);
        if (updated) set({ user: { ...current, ...updated } });
      },

      async refreshUser() {
        const current = get().user;
        if (!current) return;
        const fresh = await findProfileById(current.id);
        if (fresh) set({ user: fresh });
      },

      signOut() {
        set({ user: null });
      },
    }),
    {
      name: "world-chat-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
