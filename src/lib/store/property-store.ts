import { create } from "zustand";
import {
  createProperty,
  deleteProperty,
  listProperties,
  listPropertiesByOwner,
  updateOwnerVisibility,
  updateProperty,
} from "@/lib/data/services";
import type { Property } from "@/lib/types";

interface PropertyState {
  properties: Property[];
  myProperties: Property[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  fetchMine: (ownerId: string) => Promise<void>;
  add: (input: Parameters<typeof createProperty>[0]) => Promise<Property | null>;
  update: (id: string, patch: Parameters<typeof updateProperty>[1]) => Promise<void>;
  edit: (id: string, ownerId: string, patch: Parameters<typeof updateProperty>[1]) => Promise<boolean>;
  remove: (id: string, ownerId: string) => Promise<void>;
  updateAllVisibility: (
    ownerId: string,
    patch: { showPrice?: boolean; showAttachments?: boolean }
  ) => Promise<void>;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  myProperties: [],
  loading: false,
  error: null,

  async fetch() {
    set({ loading: true, error: null });
    try {
      set({ properties: await listProperties(), loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  async fetchMine(ownerId) {
    set({ myProperties: await listPropertiesByOwner(ownerId) });
  },

  async add(input) {
    set({ loading: true, error: null });
    try {
      const created = await createProperty(input);
      await get().fetch();
      await get().fetchMine(input.ownerId);
      set({ loading: false });
      return created;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return null;
    }
  },

  async update(id, patch) {
    const updated = await updateProperty(id, patch);
    if (updated) {
      const apply = (list: Property[]) =>
        list.map((p) => (p.id === id ? { ...p, ...updated } : p));
      set({ properties: apply(get().properties), myProperties: apply(get().myProperties) });
    }
  },

  async edit(id, ownerId, patch) {
    set({ loading: true, error: null });
    try {
      await updateProperty(id, patch);
      await get().fetch();
      await get().fetchMine(ownerId);
      set({ loading: false });
      return true;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return false;
    }
  },

  async remove(id, ownerId) {
    await deleteProperty(id);
    await get().fetch();
    await get().fetchMine(ownerId);
  },

  async updateAllVisibility(ownerId, patch) {
    await updateOwnerVisibility(ownerId, patch);
    await get().fetch();
    await get().fetchMine(ownerId);
  },
}));
