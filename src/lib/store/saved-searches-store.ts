import { create } from "zustand";
import {
  listSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
  touchSavedSearch,
  setSavedSearchNotify,
} from "@/lib/data/services";
import type { ListingFilters, SavedSearch, SavedSearchWithCount } from "@/lib/types";

interface SavedSearchesState {
  searches: SavedSearchWithCount[];
  loaded: boolean;
  loading: boolean;
  fetch: (userId: string) => Promise<void>;
  create: (userId: string, name: string, filters: ListingFilters) => Promise<SavedSearch>;
  remove: (id: string) => Promise<void>;
  markViewed: (id: string) => Promise<void>;
  setNotify: (id: string, notify: boolean) => Promise<void>;
}

export const useSavedSearchesStore = create<SavedSearchesState>((set, get) => ({
  searches: [],
  loaded: false,
  loading: false,

  async fetch(userId) {
    set({ loading: true });
    const searches = await listSavedSearches(userId);
    set({ searches, loaded: true, loading: false });
  },

  async create(userId, name, filters) {
    const s = await createSavedSearch(userId, name, filters);
    set({ searches: [{ ...s, newCount: 0 }, ...get().searches] });
    return s;
  },

  async remove(id) {
    const prev = get().searches;
    set({ searches: prev.filter((s) => s.id !== id) });
    try {
      await deleteSavedSearch(id);
    } catch {
      set({ searches: prev });
    }
  },

  async markViewed(id) {
    set({ searches: get().searches.map((s) => (s.id === id ? { ...s, newCount: 0 } : s)) });
    await touchSavedSearch(id);
  },

  async setNotify(id, notify) {
    set({ searches: get().searches.map((s) => (s.id === id ? { ...s, notify } : s)) });
    await setSavedSearchNotify(id, notify);
  },
}));
