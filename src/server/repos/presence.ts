// ─── Prisma-backed presence + typing (SERVER ONLY) ─────────────
// Realtime chat signals delivered by short-interval polling against Neon.
// Imported only by the /api/chat/* route handlers — never from the browser.
import { prisma } from "@/lib/db";

const ONLINE_MS = 60_000; // considered online if seen within the last 60s
const TYPING_MS = 6_000; // considered typing if updated within the last 6s

export async function heartbeat(userId: string, email: string): Promise<void> {
  await prisma.chatPresence.upsert({
    where: { userId },
    create: { userId, email, lastSeenAt: new Date() },
    update: { email, lastSeenAt: new Date() },
  });
}

export async function listPresence(
  userIds: string[]
): Promise<{ userId: string; online: boolean; lastSeenAt: string }[]> {
  if (userIds.length === 0) return [];
  const rows = await prisma.chatPresence.findMany({ where: { userId: { in: userIds } } });
  const cutoff = Date.now() - ONLINE_MS;
  return rows.map((r) => ({
    userId: r.userId,
    online: r.lastSeenAt.getTime() >= cutoff,
    lastSeenAt: r.lastSeenAt.toISOString(),
  }));
}

export async function setTyping(conversationId: string, userId: string, email: string): Promise<void> {
  await prisma.chatTyping.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    create: { conversationId, userId, email, updatedAt: new Date() },
    update: { email, updatedAt: new Date() },
  });
}

export async function clearTyping(conversationId: string, userId: string): Promise<void> {
  await prisma.chatTyping.deleteMany({ where: { conversationId, userId } });
}

export async function listTyping(
  conversationId: string,
  excludeUserId?: string
): Promise<{ userId: string; email: string }[]> {
  const cutoff = new Date(Date.now() - TYPING_MS);
  const rows = await prisma.chatTyping.findMany({
    where: {
      conversationId,
      updatedAt: { gte: cutoff },
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
  });
  return rows.map((r) => ({ userId: r.userId, email: r.email }));
}
