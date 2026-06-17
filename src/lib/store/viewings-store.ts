import { create } from "zustand";
import {
  listViewingsForOwner,
  listViewingsForRequester,
  createViewing,
  respondToViewing,
  cancelViewing,
} from "@/lib/data/services";
import type { Viewing } from "@/lib/types";

type ViewingInput = Omit<Viewing, "id" | "status" | "confirmedAt" | "ownerNote" | "createdAt" | "updatedAt">;

interface ViewingsState {
  received: Viewing[]; // viewings for my listings (owner)
  sent: Viewing[]; // viewings I requested (buyer)
  loaded: boolean;
  fetch: (userId: string) => Promise<void>;
  request: (input: ViewingInput) => Promise<Viewing>;
  respond: (id: string, action: "confirm" | "decline", confirmedAt?: string | null, ownerNote?: string | null) => Promise<void>;
  cancel: (id: string) => Promise<void>;
}

export const useViewingsStore = create<ViewingsState>((set, get) => ({
  received: [],
  sent: [],
  loaded: false,

  async fetch(userId) {
    const [received, sent] = await Promise.all([
      listViewingsForOwner(userId),
      listViewingsForRequester(userId),
    ]);
    set({ received, sent, loaded: true });
  },

  async request(input) {
    const v = await createViewing(input);
    set({ sent: [v, ...get().sent] });
    return v;
  },

  async respond(id, action, confirmedAt, ownerNote) {
    const updated = await respondToViewing(id, action, confirmedAt, ownerNote);
    if (updated) set({ received: get().received.map((v) => (v.id === id ? updated : v)) });
  },

  async cancel(id) {
    const updated = await cancelViewing(id);
    if (updated)
      set({
        sent: get().sent.map((v) => (v.id === id ? updated : v)),
        received: get().received.map((v) => (v.id === id ? updated : v)),
      });
  },
}));
