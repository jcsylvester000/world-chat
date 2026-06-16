"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { useNotificationStore } from "@/lib/store/notification-store";
import { useSocialStore } from "@/lib/store/social-store";
import { useRequestsStore } from "@/lib/store/requests-store";
import { cn, formatTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export default function NotificationBell() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const items = useNotificationStore((s) => s.items);
  const fetch = useNotificationStore((s) => s.fetch);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAll = useNotificationStore((s) => s.markAll);
  const socialRespond = useSocialStore((s) => s.respond);
  const requestRespond = useRequestsStore((s) => s.respond);

  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  // Fetch on mount and poll so request outcomes appear without a reload.
  useEffect(() => {
    if (!user) return;
    fetch(user.id);
    const t = setInterval(() => fetch(user.id), 15000);
    return () => clearInterval(t);
  }, [user, fetch]);

  if (!user) return null;

  const onItemClick = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const decide = async (n: AppNotification, approve: boolean) => {
    if (n.requestId) {
      if (n.type === "friend_request") await socialRespond(n.requestId, approve, user.id);
      else if (n.type === "request_new") await requestRespond(n.requestId, approve, user.id);
    }
    await markRead(n.id);
    await fetch(user.id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-lg transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={() => markAll(user.id)}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  You&apos;re all caught up.
                </p>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "border-b border-line px-4 py-3 text-sm",
                      !n.read && "bg-primary-50/60"
                    )}
                  >
                    <button
                      onClick={() => onItemClick(n)}
                      className="block text-left"
                    >
                      <p className="font-medium text-ink">{n.title}</p>
                      <p className="text-slate-600">{n.body}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatTime(n.createdAt)}
                      </p>
                    </button>
                    {!n.read && (n.type === "friend_request" || (n.type === "request_new" && n.requestKind === "documents")) && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => decide(n, true)}
                          className="btn-accent !px-3 !py-1 text-xs"
                        >
                          {n.type === "friend_request" ? "Accept" : "Approve"}
                        </button>
                        <button
                          onClick={() => decide(n, false)}
                          className="btn-outline !px-3 !py-1 text-xs"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
