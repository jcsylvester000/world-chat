import { create } from "zustand";
import {
  getLeadMeta,
  listLeadsByOwner,
  createLead,
  updateLead,
  updateLeadStage,
  deleteLead,
} from "@/lib/data/services";
import type { Lead, LeadMeta, LeadStatus } from "@/lib/types";

type LeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt">;
type LeadPatch = Partial<LeadInput>;

interface LeadsState {
  meta: LeadMeta | null;
  leads: Lead[];
  loading: boolean;
  loaded: boolean;
  fetch: (ownerId: string) => Promise<void>;
  add: (input: LeadInput) => Promise<Lead>;
  edit: (id: string, patch: LeadPatch) => Promise<void>;
  move: (id: string, stageId: string, lostReason?: string | null) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  meta: null,
  leads: [],
  loading: false,
  loaded: false,

  async fetch(ownerId) {
    set({ loading: true });
    const [meta, leads] = await Promise.all([
      get().meta ? Promise.resolve(get().meta!) : getLeadMeta(),
      listLeadsByOwner(ownerId),
    ]);
    set({ meta, leads, loading: false, loaded: true });
  },

  async add(input) {
    const lead = await createLead(input);
    set({ leads: [lead, ...get().leads] });
    return lead;
  },

  async edit(id, patch) {
    const updated = await updateLead(id, patch);
    if (updated) set({ leads: get().leads.map((l) => (l.id === id ? updated : l)) });
  },

  async move(id, stageId, lostReason) {
    const stage = get().meta?.stages.find((s) => s.id === stageId);
    const status: LeadStatus = stage?.isWon ? "won" : stage?.isLost ? "lost" : "open";
    const prev = get().leads;
    // Optimistic: reflect the move immediately so drag-and-drop feels instant.
    set({
      leads: prev.map((l) =>
        l.id === id
          ? {
              ...l,
              stageId,
              status,
              lostReason: stage?.isLost ? lostReason ?? null : null,
              updatedAt: new Date().toISOString(),
            }
          : l
      ),
    });
    try {
      const updated = await updateLeadStage(id, stageId, lostReason);
      if (updated) set({ leads: get().leads.map((l) => (l.id === id ? updated : l)) });
    } catch {
      set({ leads: prev }); // revert on failure
    }
  },

  async remove(id) {
    const prev = get().leads;
    set({ leads: prev.filter((l) => l.id !== id) });
    try {
      await deleteLead(id);
    } catch {
      set({ leads: prev });
    }
  },
}));
