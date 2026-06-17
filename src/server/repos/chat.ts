// ─── Prisma-backed Chat repository (SERVER ONLY) ───────────────
// Groups, world chat, direct messages, reactions and read-state on Neon, with
// per-plan subscription limits enforced server-side. Imported only by the
// /api/chat/* route handlers.
import { prisma } from "@/lib/db";
import {
  BASIC_GROUP_CAP,
  CHAT_RETENTION_DAYS_BASIC,
  CHAT_RETENTION_DAYS_PREMIUM,
} from "@/lib/constants";
import type {
  BillingInterval,
  ChatGroup,
  ChatOverview,
  ChatVisibility,
  DirectMessage,
  DirectThread,
  Message,
  MessageContentType,
  Plan,
  Profile,
  Reaction,
  WorldMessage,
} from "@/lib/types";

type ViewerPlan = "basic" | "premium";

function retentionCutoff(plan?: ViewerPlan): Date {
  const days = plan === "premium" ? CHAT_RETENTION_DAYS_PREMIUM : CHAT_RETENTION_DAYS_BASIC;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ── mappers ───────────────────────────────────────────────────
type DbProfile = Awaited<ReturnType<typeof prisma.profile.findUniqueOrThrow>>;
function toProfile(r: DbProfile): Profile {
  return {
    id: r.id,
    email: r.email,
    username: r.username,
    plan: r.plan as Plan,
    isAdmin: r.isAdmin,
    defaultShowPrice: r.defaultShowPrice,
    defaultShowAttachments: r.defaultShowAttachments,
    code: r.code,
    chatVisibility: r.chatVisibility as ChatVisibility,
    allowFriendRequests: r.allowFriendRequests,
    active: r.active,
    planInterval: (r.planInterval as BillingInterval | null) ?? null,
    planRenewsAt: r.planRenewsAt ? r.planRenewsAt.toISOString() : null,
    lastActiveAt: r.lastActiveAt.toISOString(),
    verified: r.verified,
    company: r.company,
    licenseNo: r.licenseNo,
  };
}

type DbGroupMessage = Awaited<ReturnType<typeof prisma.message.findUniqueOrThrow>>;
function toGroupMessage(r: DbGroupMessage): Message {
  return {
    id: r.id,
    groupId: r.groupId,
    userId: r.userId,
    userEmail: r.userEmail,
    content: r.content,
    contentType: r.contentType as MessageContentType,
    filename: r.filename ?? undefined,
    createdAt: r.createdAt.toISOString(),
    replyToId: r.replyToId ?? undefined,
    replyToAuthor: r.replyToAuthor ?? undefined,
    replyToPreview: r.replyToPreview ?? undefined,
    editedAt: r.editedAt ? r.editedAt.toISOString() : undefined,
    deleted: r.deleted,
  };
}

type DbWorldMessage = Awaited<ReturnType<typeof prisma.worldMessage.findUniqueOrThrow>>;
function toWorldMessage(r: DbWorldMessage): WorldMessage {
  return {
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    content: r.content,
    contentType: r.contentType as MessageContentType,
    filename: r.filename ?? undefined,
    createdAt: r.createdAt.toISOString(),
    replyToId: r.replyToId ?? undefined,
    replyToAuthor: r.replyToAuthor ?? undefined,
    replyToPreview: r.replyToPreview ?? undefined,
    editedAt: r.editedAt ? r.editedAt.toISOString() : undefined,
    deleted: r.deleted,
  };
}

type DbDirectMessage = Awaited<ReturnType<typeof prisma.directMessage.findUniqueOrThrow>>;
function toDirectMessage(r: DbDirectMessage): DirectMessage {
  return {
    id: r.id,
    threadId: r.threadId,
    senderId: r.senderId,
    senderEmail: r.senderEmail,
    content: r.content,
    contentType: r.contentType as MessageContentType,
    filename: r.filename ?? undefined,
    createdAt: r.createdAt.toISOString(),
    replyToId: r.replyToId ?? undefined,
    replyToAuthor: r.replyToAuthor ?? undefined,
    replyToPreview: r.replyToPreview ?? undefined,
    editedAt: r.editedAt ? r.editedAt.toISOString() : undefined,
    deleted: r.deleted,
  };
}

function toGroup(r: { id: string; name: string; createdByEmail: string }): ChatGroup {
  return { id: r.id, name: r.name, createdByEmail: r.createdByEmail };
}

// ── groups ────────────────────────────────────────────────────
export async function listGroupsForUser(userId: string): Promise<ChatGroup[]> {
  const me = await prisma.profile.findUnique({ where: { id: userId }, select: { email: true } });
  const rows = await prisma.chatGroup.findMany({
    where: {
      OR: [{ members: { some: { userId } } }, ...(me ? [{ createdByEmail: me.email }] : [])],
    },
    orderBy: { name: "asc" },
  });
  return rows.map(toGroup);
}

export async function listGroupMembers(groupId: string): Promise<Profile[]> {
  const rows = await prisma.groupMember.findMany({ where: { groupId }, include: { member: true } });
  return rows.map((r) => toProfile(r.member));
}

export async function createGroup(
  name: string,
  createdByEmail: string,
  memberEmails: string[]
): Promise<ChatGroup> {
  const creator = await prisma.profile.findUnique({ where: { email: createdByEmail }, select: { plan: true } });
  if (creator && creator.plan === "basic") {
    const count = await prisma.chatGroup.count({ where: { createdByEmail } });
    if (count >= BASIC_GROUP_CAP) {
      throw new Error(
        `Basic plan is limited to ${BASIC_GROUP_CAP} groups. Upgrade to Premium for unlimited groups.`
      );
    }
  }
  const emails = Array.from(new Set([createdByEmail, ...memberEmails]));
  const members = await prisma.profile.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const group = await prisma.chatGroup.create({
    data: { name, createdByEmail, members: { create: members.map((m) => ({ userId: m.id })) } },
  });
  return toGroup(group);
}

export async function renameGroup(groupId: string, name: string): Promise<void> {
  await prisma.chatGroup.update({ where: { id: groupId }, data: { name } });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await prisma.chatGroup.delete({ where: { id: groupId } });
}

export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId },
    update: {},
  });
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await prisma.groupMember.deleteMany({ where: { groupId, userId } });
}

export async function listGroupMessages(groupId: string, viewerPlan?: ViewerPlan): Promise<Message[]> {
  const rows = await prisma.message.findMany({
    where: { groupId, createdAt: { gte: retentionCutoff(viewerPlan) } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toGroupMessage);
}

export type CreateGroupMessage = Omit<Message, "id" | "createdAt" | "editedAt" | "deleted">;
export async function sendGroupMessage(input: CreateGroupMessage): Promise<Message> {
  const row = await prisma.message.create({
    data: {
      groupId: input.groupId,
      userId: input.userId,
      userEmail: input.userEmail,
      content: input.content,
      contentType: input.contentType,
      filename: input.filename ?? null,
      replyToId: input.replyToId ?? null,
      replyToAuthor: input.replyToAuthor ?? null,
      replyToPreview: input.replyToPreview ?? null,
    },
  });
  return toGroupMessage(row);
}

export async function editGroupMessage(id: string, content: string): Promise<void> {
  await prisma.message.update({ where: { id }, data: { content, editedAt: new Date() } });
}

export async function deleteGroupMessage(id: string): Promise<void> {
  await prisma.message.update({
    where: { id },
    data: { deleted: true, content: "", contentType: "text", filename: null },
  });
}

// ── world ─────────────────────────────────────────────────────
export async function listWorldMessages(viewerPlan?: ViewerPlan): Promise<WorldMessage[]> {
  const rows = await prisma.worldMessage.findMany({
    where: { createdAt: { gte: retentionCutoff(viewerPlan) } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toWorldMessage);
}

export type CreateWorldMessage = Omit<WorldMessage, "id" | "createdAt" | "editedAt" | "deleted">;
export async function sendWorldMessage(input: CreateWorldMessage): Promise<WorldMessage> {
  const sender = await prisma.profile.findUnique({ where: { id: input.userId }, select: { plan: true } });
  if (sender && sender.plan === "basic") {
    throw new Error(
      "Posting to World chat is a Premium feature. Basic accounts can read World chat and post in DMs and groups."
    );
  }
  const row = await prisma.worldMessage.create({
    data: {
      userId: input.userId,
      userEmail: input.userEmail,
      content: input.content,
      contentType: input.contentType,
      filename: input.filename ?? null,
      replyToId: input.replyToId ?? null,
      replyToAuthor: input.replyToAuthor ?? null,
      replyToPreview: input.replyToPreview ?? null,
    },
  });
  return toWorldMessage(row);
}

export async function editWorldMessage(id: string, content: string): Promise<void> {
  await prisma.worldMessage.update({ where: { id }, data: { content, editedAt: new Date() } });
}

export async function deleteWorldMessage(id: string): Promise<void> {
  await prisma.worldMessage.update({
    where: { id },
    data: { deleted: true, content: "", contentType: "text", filename: null },
  });
}

// ── direct ────────────────────────────────────────────────────
export async function listThreadsForUser(userId: string): Promise<DirectThread[]> {
  const rows = await prisma.directThread.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: { userA: { select: { email: true } }, userB: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    participantIds: [r.userAId, r.userBId],
    participantEmails: [r.userA.email, r.userB.email],
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getOrCreateThread(
  a: { id: string; email: string },
  b: { id: string; email: string }
): Promise<DirectThread> {
  const existing = await prisma.directThread.findFirst({
    where: {
      OR: [
        { userAId: a.id, userBId: b.id },
        { userAId: b.id, userBId: a.id },
      ],
    },
  });
  const row = existing ?? (await prisma.directThread.create({ data: { userAId: a.id, userBId: b.id } }));
  const ids: [string, string] = [row.userAId, row.userBId];
  const emails: [string, string] =
    row.userAId === a.id ? [a.email, b.email] : [b.email, a.email];
  return { id: row.id, participantIds: ids, participantEmails: emails, createdAt: row.createdAt.toISOString() };
}

export async function listDirectMessages(threadId: string, viewerPlan?: ViewerPlan): Promise<DirectMessage[]> {
  const rows = await prisma.directMessage.findMany({
    where: { threadId, createdAt: { gte: retentionCutoff(viewerPlan) } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDirectMessage);
}

export type CreateDirectMessage = Omit<DirectMessage, "id" | "createdAt" | "editedAt" | "deleted">;
export async function sendDirectMessage(input: CreateDirectMessage): Promise<DirectMessage> {
  const row = await prisma.directMessage.create({
    data: {
      threadId: input.threadId,
      senderId: input.senderId,
      senderEmail: input.senderEmail,
      content: input.content,
      contentType: input.contentType,
      filename: input.filename ?? null,
      replyToId: input.replyToId ?? null,
      replyToAuthor: input.replyToAuthor ?? null,
      replyToPreview: input.replyToPreview ?? null,
    },
  });
  return toDirectMessage(row);
}

export async function editDirectMessage(id: string, content: string): Promise<void> {
  await prisma.directMessage.update({ where: { id }, data: { content, editedAt: new Date() } });
}

export async function deleteDirectMessage(id: string): Promise<void> {
  await prisma.directMessage.update({
    where: { id },
    data: { deleted: true, content: "", contentType: "text", filename: null },
  });
}


// One batched summary for the messages list: unread counts per conversation +
// each DM thread's last message. Replaces fetching every conversation's full
// history client-side (big win when a user has many chats).
export async function chatOverview(userId: string): Promise<ChatOverview> {
  const floor = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const reads = await prisma.messageRead.findMany({ where: { userId } });
  const readAt = (key: string) => reads.find((x) => x.conversationId === key)?.lastReadAt ?? new Date(0);

  const world = await prisma.worldMessage.count({ where: { createdAt: { gt: readAt("world") }, userId: { not: userId } } });

  const memberships = await prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } });
  const groupIds = memberships.map((m) => m.groupId);
  const groups: Record<string, number> = {};
  for (const g of groupIds) groups[g] = 0;
  if (groupIds.length) {
    const gmsgs = await prisma.message.findMany({
      where: { groupId: { in: groupIds }, userId: { not: userId }, createdAt: { gte: floor } },
      select: { groupId: true, createdAt: true },
    });
    for (const m of gmsgs) if (m.createdAt > readAt("group:" + m.groupId)) groups[m.groupId] = (groups[m.groupId] ?? 0) + 1;
  }

  const dts = await prisma.directThread.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] }, select: { id: true },
  });
  const threadIds = dts.map((t) => t.id);
  const threads: ChatOverview["threads"] = {};
  for (const id of threadIds) threads[id] = { unread: 0, last: null };
  if (threadIds.length) {
    const dms = await prisma.directMessage.findMany({
      where: { threadId: { in: threadIds }, createdAt: { gte: floor } },
      select: { threadId: true, senderId: true, content: true, contentType: true, createdAt: true, deleted: true },
      orderBy: { createdAt: "asc" },
    });
    for (const m of dms) {
      const th = threads[m.threadId];
      if (!th) continue;
      th.last = { content: m.deleted ? "" : m.content, contentType: m.contentType as MessageContentType, createdAt: m.createdAt.toISOString(), senderId: m.senderId };
      if (m.senderId !== userId && !m.deleted && m.createdAt > readAt("dm:" + m.threadId)) th.unread += 1;
    }
  }

  return { world, groups, threads };
}

// ── reactions ─────────────────────────────────────────────────
export async function listReactions(messageIds: string[]): Promise<(Reaction & { messageId: string })[]> {
  if (messageIds.length === 0) return [];
  const rows = await prisma.messageReaction.findMany({ where: { messageId: { in: messageIds } } });
  return rows.map((r) => ({ messageId: r.messageId, emoji: r.emoji, userId: r.userId, userEmail: r.userEmail }));
}

export async function toggleReaction(
  messageId: string,
  userId: string,
  userEmail: string,
  emoji: string
): Promise<void> {
  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });
  if (existing) await prisma.messageReaction.delete({ where: { id: existing.id } });
  else await prisma.messageReaction.create({ data: { messageId, userId, userEmail, emoji } });
}

// ── read-state ────────────────────────────────────────────────
export async function listReads(userId: string): Promise<{ conversationId: string; lastReadAt: string }[]> {
  const rows = await prisma.messageRead.findMany({ where: { userId } });
  return rows.map((r) => ({ conversationId: r.conversationId, lastReadAt: r.lastReadAt.toISOString() }));
}

export async function markRead(userId: string, conversationId: string): Promise<void> {
  await prisma.messageRead.upsert({
    where: { userId_conversationId: { userId, conversationId } },
    create: { userId, conversationId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });
}
