"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearTyping,
  fetchPresence,
  fetchTyping,
  heartbeatPresence,
  postTyping,
} from "@/lib/data/realtime";

// Keep my presence fresh: heartbeat on mount, every 30s, and when the tab
// becomes visible again.
export function usePresenceHeartbeat(userId?: string, email?: string) {
  useEffect(() => {
    if (!userId || !email) return;
    heartbeatPresence(userId, email);
    const id = setInterval(() => heartbeatPresence(userId, email), 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") heartbeatPresence(userId, email);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [userId, email]);
}

// Online map for a set of user ids, polled every 15s.
export function usePresence(userIds: string[]): Record<string, boolean> {
  const [map, setMap] = useState<Record<string, boolean>>({});
  const key = [...new Set(userIds)].sort().join(",");
  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) {
      setMap({});
      return;
    }
    let alive = true;
    const tick = async () => {
      const m = await fetchPresence(ids);
      if (alive) setMap(m);
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [key]);
  return map;
}

// Typing users for a conversation (polled every 2.5s) plus throttled notify /
// stop helpers to broadcast my own typing state.
export function useTyping(conversationId: string | null, meId?: string, meEmail?: string) {
  const [typers, setTypers] = useState<{ userId: string; email: string }[]>([]);
  const lastSent = useRef(0);

  useEffect(() => {
    if (!conversationId || !meId) {
      setTypers([]);
      return;
    }
    let alive = true;
    const tick = async () => {
      const t = await fetchTyping(conversationId, meId);
      if (alive) setTypers(t);
    };
    tick();
    const id = setInterval(tick, 2_500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [conversationId, meId]);

  const notifyTyping = useCallback(() => {
    if (!conversationId || !meId || !meEmail) return;
    const now = Date.now();
    if (now - lastSent.current < 2_000) return; // throttle broadcasts
    lastSent.current = now;
    postTyping(conversationId, meId, meEmail);
  }, [conversationId, meId, meEmail]);

  const stopTyping = useCallback(() => {
    if (!conversationId || !meId) return;
    lastSent.current = 0;
    clearTyping(conversationId, meId);
  }, [conversationId, meId]);

  return { typers, notifyTyping, stopTyping };
}
