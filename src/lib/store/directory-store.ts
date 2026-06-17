import { create } from "zustand";
import { listProfiles } from "@/lib/data/services";
import type { Profile } from "@/lib/types";

// A lightweight client-side profile directory (loaded once) so any component
// can look up an owner's verified status / company by email without a fetch.
interface DirectoryState {
  byEmail: Record<string, Profile>;
  loaded: boolean;
  fetch: () => Promise<void>;
}

export const useDirectoryStore = create<DirectoryState>((set) => ({
  byEmail: {},
  loaded: false,
  async fetch() {
    const profiles = await listProfiles();
    const byEmail: Record<string, Profile> = {};
    for (const p of profiles) byEmail[p.email] = p;
    set({ byEmail, loaded: true });
  },
}));
