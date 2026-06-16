import { create } from "zustand";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/data/services";
import type { AppNotification } from "@/lib/types";

interface NotificationState {
  items: AppNotification[];
  fetch: (userId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAll: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  async fetch(userId) {
    set({ items: await listNotifications(userId) });
  },
  async markRead(id) {
    await markNotificationRead(id);
    set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) });
  },
  async markAll(userId) {
    await markAllNotificationsRead(userId);
    set({ items: get().items.map((n) => ({ ...n, read: true })) });
  },
}));
