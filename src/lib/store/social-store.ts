import { create } from "zustand";
import {
  findProfileByCode,
  listContacts,
  listIncomingFriendRequests,
  listOutgoingFriendRequests,
  respondFriendRequest,
  searchDiscoverableUsers,
  sendFriendRequest,
} from "@/lib/data/services";
import type { FriendRequest, Profile } from "@/lib/types";

interface SocialState {
  contacts: Profile[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  refresh: (userId: string) => Promise<void>;
  search: (query: string, excludeId: string) => Promise<Profile[]>;
  requestById: (from: Profile, to: Profile) => Promise<{ ok: boolean; reason?: string }>;
  requestByCode: (from: Profile, code: string) => Promise<{ ok: boolean; reason?: string }>;
  respond: (requestId: string, accept: boolean, userId: string) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  contacts: [],
  incoming: [],
  outgoing: [],

  async refresh(userId) {
    const [contacts, incoming, outgoing] = await Promise.all([
      listContacts(userId),
      listIncomingFriendRequests(userId),
      listOutgoingFriendRequests(userId),
    ]);
    set({ contacts, incoming, outgoing });
  },

  search(query, excludeId) {
    return searchDiscoverableUsers(query, excludeId);
  },

  async requestById(from, to) {
    const res = await sendFriendRequest(from, to);
    if (res.ok) await get().refresh(from.id);
    return res;
  },

  async requestByCode(from, code) {
    const target = await findProfileByCode(code);
    if (!target) return { ok: false, reason: "No user found with that code." };
    return get().requestById(from, target);
  },

  async respond(requestId, accept, userId) {
    await respondFriendRequest(requestId, accept);
    await get().refresh(userId);
  },
}));
