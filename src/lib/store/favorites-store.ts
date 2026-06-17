import { create } from "zustand";
import { listFavoriteProperties, addFavorite, removeFavorite } from "@/lib/data/services";
import type { Property } from "@/lib/types";

interface FavoritesState {
  ids: Set<string>; // propertyIds the user has saved (reactive source for hearts)
  properties: Property[]; // the saved listings (for the /saved page)
  loaded: boolean;
  loading: boolean;
  fetch: (userId: string) => Promise<void>;
  toggle: (userId: string, propertyId: string, property?: Property) => Promise<void>;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  properties: [],
  loaded: false,
  loading: false,

  async fetch(userId) {
    set({ loading: true });
    const props = await listFavoriteProperties(userId);
    set({ properties: props, ids: new Set(props.map((p) => p.id)), loaded: true, loading: false });
  },

  async toggle(userId, propertyId, property) {
    const wasFav = get().ids.has(propertyId);
    const ids = new Set(get().ids);
    if (wasFav) {
      ids.delete(propertyId);
      set({ ids, properties: get().properties.filter((p) => p.id !== propertyId) });
    } else {
      ids.add(propertyId);
      set({ ids, properties: property ? [property, ...get().properties] : get().properties });
    }
    try {
      if (wasFav) await removeFavorite(userId, propertyId);
      else await addFavorite(userId, propertyId);
    } catch {
      const revert = new Set(get().ids);
      if (wasFav) revert.add(propertyId);
      else revert.delete(propertyId);
      set({ ids: revert });
    }
  },

  reset() {
    set({ ids: new Set(), properties: [], loaded: false });
  },
}));
