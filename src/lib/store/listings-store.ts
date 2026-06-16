import { create } from "zustand";
import { queryListings } from "@/lib/data/services";
import type { ListingFilters, Property } from "@/lib/types";

interface ListingsState {
  items: Property[];
  totalCount: number;
  page: number;
  perPage: number;
  loading: boolean;
  filters: ListingFilters;
  fetch: () => Promise<void>;
  setPage: (page: number) => Promise<void>;
  setPerPage: (n: number) => Promise<void>;
  setFilters: (patch: Partial<ListingFilters>) => Promise<void>;
}

const DEFAULT_FILTERS: ListingFilters = {
  searchText: "",
  minPrice: 0,
  maxPrice: 99_999_999,
  selectedTags: [],
  type: "",
  hasAts: "",
};

export const useListingsStore = create<ListingsState>((set, get) => ({
  items: [],
  totalCount: 0,
  page: 1,
  perPage: 12,
  loading: false,
  filters: { ...DEFAULT_FILTERS },

  async fetch() {
    set({ loading: true });
    const { page, perPage, filters } = get();
    const { items, totalCount } = await queryListings(filters, page, perPage);
    set({ items, totalCount, loading: false });
  },

  async setPage(page) {
    set({ page: Math.max(1, page) });
    await get().fetch();
  },

  async setPerPage(n) {
    set({ perPage: n, page: 1 });
    await get().fetch();
  },

  async setFilters(patch) {
    set({ filters: { ...get().filters, ...patch }, page: 1 });
    await get().fetch();
  },
}));
