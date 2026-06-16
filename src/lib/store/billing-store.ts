import { create } from "zustand";
import {
  approvePayment,
  getClock,
  listAllPayments,
  listInvoices,
  rejectPayment,
  runBillingCycle,
  sendPaymentReminder,
  setClock,
  type BillingRunResult,
} from "@/lib/data/services";
import type { Invoice, Payment, Plan, Profile } from "@/lib/types";

interface BillingState {
  invoices: Invoice[];
  payments: Payment[];
  clock: string | null;
  loading: boolean;
  fetchAll: () => Promise<void>;
  setClock: (iso: string | null) => Promise<void>;
  runCycle: (admin: Profile) => Promise<BillingRunResult>;
  approve: (admin: Profile, paymentId: string, userId: string, plan: Plan) => Promise<void>;
  reject: (admin: Profile, paymentId: string) => Promise<void>;
  sendReminder: (admin: Profile, userIds: string[], dueDateIso: string) => Promise<number>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  invoices: [],
  payments: [],
  clock: null,
  loading: false,

  async fetchAll() {
    set({ loading: true });
    const [invoices, payments, clock] = await Promise.all([
      listInvoices(),
      listAllPayments(),
      getClock(),
    ]);
    set({ invoices, payments, clock, loading: false });
  },

  async setClock(iso) {
    await setClock(iso);
    await get().fetchAll();
  },
  async runCycle(admin) {
    const result = await runBillingCycle(admin);
    await get().fetchAll();
    return result;
  },
  async approve(admin, paymentId, userId, plan) {
    await approvePayment(admin, paymentId, userId, plan);
    await get().fetchAll();
  },
  async reject(admin, paymentId) {
    await rejectPayment(admin, paymentId);
    await get().fetchAll();
  },
  async sendReminder(admin, userIds, dueDateIso) {
    return sendPaymentReminder(admin, userIds, dueDateIso);
  },
}));
