import { create } from "zustand";
import {
  adminMessageUser,
  adminResetPassword,
  adminSetUserActive,
  adminSetUserPlan,
  approvePayment,
  listAuditLogs,
  listPendingPayments,
  listUsersForAdmin,
  rejectPayment,
} from "@/lib/data/services";
import type { AuditLog, BillingInterval, Payment, Plan, Profile } from "@/lib/types";

interface AdminState {
  users: Profile[];
  payments: Payment[];
  logs: AuditLog[];
  fetchAll: () => Promise<void>;
  approve: (admin: Profile, paymentId: string, userId: string, plan: Plan) => Promise<void>;
  reject: (admin: Profile, paymentId: string) => Promise<void>;
  setPlan: (admin: Profile, userId: string, plan: Plan, interval?: BillingInterval) => Promise<void>;
  setActive: (admin: Profile, userId: string, active: boolean) => Promise<void>;
  resetPassword: (admin: Profile, userId: string) => Promise<string>;
  message: (admin: Profile, target: Profile, content: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  payments: [],
  logs: [],

  async fetchAll() {
    const [users, payments, logs] = await Promise.all([
      listUsersForAdmin(),
      listPendingPayments(),
      listAuditLogs(),
    ]);
    set({ users, payments, logs });
  },

  async approve(admin, paymentId, userId, plan) {
    await approvePayment(admin, paymentId, userId, plan);
    await get().fetchAll();
  },
  async reject(admin, paymentId) {
    await rejectPayment(admin, paymentId);
    await get().fetchAll();
  },
  async setPlan(admin, userId, plan, interval) {
    await adminSetUserPlan(admin, userId, plan, interval);
    await get().fetchAll();
  },
  async setActive(admin, userId, active) {
    await adminSetUserActive(admin, userId, active);
    await get().fetchAll();
  },
  async resetPassword(admin, userId) {
    const temp = await adminResetPassword(admin, userId);
    await get().fetchAll();
    return temp;
  },
  async message(admin, target, content) {
    await adminMessageUser(admin, target, content);
    await get().fetchAll();
  },
}));
