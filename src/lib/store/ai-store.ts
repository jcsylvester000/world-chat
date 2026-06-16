import { create } from "zustand";
import {
  submitAiRequest,
  listAiRequests,
  listAiRequestsForUser,
  reviewAiRequest,
} from "@/lib/data/services";
import type { AiFile, AiRequest, AiRequestStatus, AiToolType, Profile } from "@/lib/types";

interface SubmitAiInput {
  userId: string;
  userEmail: string;
  type: AiToolType;
  price: number;
  description: string;
  documents: AiFile[];
  proofUrl: string | null;
}

interface AiState {
  requests: AiRequest[];
  loading: boolean;
  scopeUserId: string | null; // null = admin (all requests)
  fetchAll: () => Promise<void>;
  fetchMine: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  submit: (input: SubmitAiInput) => Promise<AiRequest>;
  review: (
    admin: Profile,
    id: string,
    status: AiRequestStatus,
    opts?: { notes?: string; resultDocuments?: AiFile[] }
  ) => Promise<void>;
}

export const useAiStore = create<AiState>((set, get) => ({
  requests: [],
  loading: false,
  scopeUserId: null,

  async fetchAll() {
    set({ loading: true, scopeUserId: null, requests: [] });
    set({ requests: await listAiRequests(), loading: false });
  },
  async fetchMine(userId) {
    set({ loading: true, scopeUserId: userId, requests: [] });
    set({ requests: await listAiRequestsForUser(userId), loading: false });
  },
  async refresh() {
    const { scopeUserId } = get();
    set({ requests: scopeUserId ? await listAiRequestsForUser(scopeUserId) : await listAiRequests() });
  },
  async submit(input) {
    const r = await submitAiRequest(input);
    await get().refresh();
    return r;
  },
  async review(admin, id, status, opts) {
    await reviewAiRequest(admin, id, status, opts);
    await get().refresh();
  },
}));
