// Chat-only seed — loads the demo groups / messages / threads into Neon
// without touching profiles, properties or leads. Run with:
//   npx tsx prisma/seed-chat.ts
import { PrismaClient } from "@prisma/client";
import {
  chatGroups,
  groupMembers,
  messages,
  worldMessages,
  directThreads,
  directMessages,
} from "@/lib/data/mock-data";

const prisma = new PrismaClient();

async function main() {
  // Clear chat content only (FK-safe order).
  await prisma.message.deleteMany();
  await prisma.worldMessage.deleteMany();
  await prisma.directMessage.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.chatGroup.deleteMany();
  await prisma.directThread.deleteMany();

  for (const g of chatGroups) {
    await prisma.chatGroup.create({ data: { id: g.id, name: g.name, createdByEmail: g.createdByEmail } });
  }
  for (const [groupId, userIds] of Object.entries(groupMembers)) {
    for (const userId of userIds) await prisma.groupMember.create({ data: { groupId, userId } });
  }
  for (const m of messages) {
    await prisma.message.create({
      data: {
        id: m.id, groupId: m.groupId, userId: m.userId, userEmail: m.userEmail,
        content: m.content, contentType: m.contentType, filename: m.filename ?? null,
        createdAt: new Date(m.createdAt),
      },
    });
  }
  for (const w of worldMessages) {
    await prisma.worldMessage.create({
      data: {
        id: w.id, userId: w.userId, userEmail: w.userEmail, content: w.content,
        contentType: w.contentType, filename: w.filename ?? null, createdAt: new Date(w.createdAt),
      },
    });
  }
  for (const t of directThreads) {
    await prisma.directThread.create({
      data: { id: t.id, userAId: t.participantIds[0], userBId: t.participantIds[1], createdAt: new Date(t.createdAt) },
    });
  }
  for (const d of directMessages) {
    await prisma.directMessage.create({
      data: {
        id: d.id, threadId: d.threadId, senderId: d.senderId, senderEmail: d.senderEmail,
        content: d.content, contentType: d.contentType, filename: d.filename ?? null, createdAt: new Date(d.createdAt),
      },
    });
  }

  const [g, mem, msg, w, th, dm] = await Promise.all([
    prisma.chatGroup.count(), prisma.groupMember.count(), prisma.message.count(),
    prisma.worldMessage.count(), prisma.directThread.count(), prisma.directMessage.count(),
  ]);
  console.log("SEEDED " + JSON.stringify({ groups: g, members: mem, groupMsgs: msg, world: w, threads: th, directMsgs: dm }));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
