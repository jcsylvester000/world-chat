// ─── Prisma-backed Property Teaser repository (SERVER ONLY) ─────
// Saved drafts + export-usage counter, tied to a user's account on Neon, with
// per-plan limits enforced server-side. Imported only by /api/teaser/* routes.
import { prisma } from "@/lib/db";
import { BASIC_TEASER_DRAFT_CAP, BASIC_TEASER_USE_CAP, type TeaserDraft, type TeaserForm } from "@/lib/teaser/types";

async function isUnlimited(userId: string): Promise<boolean> {
  const p = await prisma.profile.findUnique({ where: { id: userId }, select: { plan: true, isAdmin: true } });
  return !!p && (p.plan === "premium" || p.isAdmin);
}

type DbDraft = Awaited<ReturnType<typeof prisma.teaserDraft.findUniqueOrThrow>>;
function toDraft(r: DbDraft): TeaserDraft {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    data: r.data as unknown as TeaserForm,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listDrafts(userId: string): Promise<TeaserDraft[]> {
  const rows = await prisma.teaserDraft.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return rows.map(toDraft);
}

export async function saveDraft(
  userId: string,
  input: { id?: string; title: string; data: TeaserForm }
): Promise<TeaserDraft> {
  // Updating an existing draft is always allowed (no new slot consumed).
  if (input.id) {
    const owned = await prisma.teaserDraft.findFirst({ where: { id: input.id, userId } });
    if (owned) {
      const row = await prisma.teaserDraft.update({
        where: { id: input.id },
        data: { title: input.title, data: input.data as object },
      });
      return toDraft(row);
    }
  }
  if (!(await isUnlimited(userId))) {
    const count = await prisma.teaserDraft.count({ where: { userId } });
    if (count >= BASIC_TEASER_DRAFT_CAP) {
      throw new Error(
        `Free plan can keep ${BASIC_TEASER_DRAFT_CAP} saved teaser draft. Delete it or upgrade to Premium for unlimited drafts.`
      );
    }
  }
  const row = await prisma.teaserDraft.create({ data: { userId, title: input.title, data: input.data as object } });
  return toDraft(row);
}

export async function deleteDraft(userId: string, id: string): Promise<void> {
  await prisma.teaserDraft.deleteMany({ where: { id, userId } });
}

export async function getUsage(userId: string): Promise<{ count: number; unlimited: boolean }> {
  const [row, unlimited] = await Promise.all([
    prisma.teaserUsage.findUnique({ where: { userId } }),
    isUnlimited(userId),
  ]);
  return { count: row?.count ?? 0, unlimited };
}

export async function recordUse(userId: string): Promise<{ count: number; unlimited: boolean }> {
  const unlimited = await isUnlimited(userId);
  const existing = await prisma.teaserUsage.findUnique({ where: { userId } });
  const current = existing?.count ?? 0;
  if (!unlimited && current >= BASIC_TEASER_USE_CAP) {
    throw new Error(
      `Free plan includes ${BASIC_TEASER_USE_CAP} teaser exports. Upgrade to Premium for unlimited exports.`
    );
  }
  const row = await prisma.teaserUsage.upsert({
    where: { userId },
    create: { userId, count: 1 },
    update: { count: { increment: 1 } },
  });
  return { count: row.count, unlimited };
}
