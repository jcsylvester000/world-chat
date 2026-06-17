// ─── Prisma-backed Broker Analytics (SERVER ONLY) ───────────────
// Per-listing views/saves/inquiries + the lead pipeline funnel for a broker.
import { prisma } from "@/lib/db";
import type { BrokerAnalytics } from "@/lib/types";

export async function getBrokerAnalytics(ownerId: string): Promise<BrokerAnalytics> {
  const props = await prisma.property.findMany({
    where: { ownerId },
    select: {
      id: true,
      title: true,
      price: true,
      views: true,
      _count: { select: { favoritedBy: true, viewings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const listings = props.map((p) => ({
    id: p.id,
    title: p.title,
    price: Number(p.price),
    views: p.views,
    saves: p._count.favoritedBy,
    viewings: p._count.viewings,
  }));

  const [stages, leads] = await Promise.all([
    prisma.leadStage.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.lead.findMany({ where: { ownerId }, select: { stageId: true, value: true } }),
  ]);
  const funnel = stages.map((st) => {
    const ls = leads.filter((l) => l.stageId === st.id);
    return {
      stageId: st.id,
      stageName: st.name,
      count: ls.length,
      value: ls.reduce((s, l) => s + Number(l.value), 0),
    };
  });

  return { listings, funnel };
}
