// Client-side helpers for the Neon-backed realtime chat signals (presence +
// typing). These talk only to the /api/chat/* routes — never the mock arrays.
// All calls swallow errors so a transient poll failure never breaks the UI.
import { apiGet, apiSend, USE_PRISMA } from "@/lib/api";

export async function heartbeatPresence(userId: string, email: string): Promise<void> {
  if (!USE_PRISMA) return;
  try {
    await apiSend("/api/chat/presence", "POST", { userId, email });
  } catch {
    /* ignore transient heartbeat failures */
  }
}

export async function fetchPresence(userIds: string[]): Promise<Record<string, boolean>> {
  if (!USE_PRISMA || userIds.length === 0) return {};
  try {
    const rows = await apiGet<{ userId: string; online: boolean }[]>(
      `/api/chat/presence?userIds=${encodeURIComponent(userIds.join(","))}`
    );
    return Object.fromEntries(rows.map((r) => [r.userId, r.online]));
  } catch {
    return {};
  }
}

export async function postTyping(conversationId: string, userId: string, email: string): Promise<void> {
  if (!USE_PRISMA) return;
  try {
    await apiSend("/api/chat/typing", "POST", { conversationId, userId, email });
  } catch {
    /* ignore */
  }
}

export async function clearTyping(conversationId: string, userId: string): Promise<void> {
  if (!USE_PRISMA) return;
  try {
    await apiSend(
      `/api/chat/typing?conversationId=${encodeURIComponent(conversationId)}&userId=${encodeURIComponent(userId)}`,
      "DELETE"
    );
  } catch {
    /* ignore */
  }
}

export async function fetchTyping(
  conversationId: string,
  excludeUserId: string
): Promise<{ userId: string; email: string }[]> {
  if (!USE_PRISMA) return [];
  try {
    return await apiGet<{ userId: string; email: string }[]>(
      `/api/chat/typing?conversationId=${encodeURIComponent(conversationId)}&excludeUserId=${encodeURIComponent(excludeUserId)}`
    );
  } catch {
    return [];
  }
}
