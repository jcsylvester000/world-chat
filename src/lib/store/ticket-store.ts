import { create } from "zustand";
import {
  createTicket,
  listTickets,
  listTicketsForUser,
  replyTicket,
  setTicketStatus,
} from "@/lib/data/services";
import type { Plan, Profile, SupportTicket, TicketCategory, TicketStatus } from "@/lib/types";

interface CreateTicketInput {
  userId: string;
  userEmail: string;
  plan: Plan;
  priority: boolean;
  category: TicketCategory;
  subject: string;
  message: string;
}

interface TicketState {
  tickets: SupportTicket[];
  loading: boolean;
  scopeUserId: string | null; // null = admin (all tickets)
  fetchAll: () => Promise<void>;
  fetchMine: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  create: (input: CreateTicketInput) => Promise<SupportTicket>;
  reply: (ticketId: string, from: Profile, body: string) => Promise<void>;
  setStatus: (admin: Profile, ticketId: string, status: TicketStatus) => Promise<void>;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  loading: false,
  scopeUserId: null,

  async fetchAll() {
    set({ loading: true, scopeUserId: null, tickets: [] });
    set({ tickets: await listTickets(), loading: false });
  },
  async fetchMine(userId) {
    set({ loading: true, scopeUserId: userId, tickets: [] });
    set({ tickets: await listTicketsForUser(userId), loading: false });
  },
  async refresh() {
    const { scopeUserId } = get();
    set({ tickets: scopeUserId ? await listTicketsForUser(scopeUserId) : await listTickets() });
  },
  async create(input) {
    const t = await createTicket(input);
    await get().refresh();
    return t;
  },
  async reply(ticketId, from, body) {
    await replyTicket(ticketId, from, body);
    await get().refresh();
  },
  async setStatus(admin, ticketId, status) {
    await setTicketStatus(admin, ticketId, status);
    await get().refresh();
  },
}));
