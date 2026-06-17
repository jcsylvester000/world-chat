// ─── Prisma-backed Favorites repository (SERVER ONLY) ───────────
// Saved/shortlisted listings. Imported only by the /api/favorites routes.
import { prisma } from "@/lib/db";
import { toProperty, type Row } from "@/server/repos/properties";
import type { Property } from "@/lib/types";

// The listings a user has saved (most-recently-saved first).
export async function listFavoriteProperties(userId: string): Promise<Property[]> {
  const favs = await prisma.favorite.findMany({
    where: { userId },
    include: { property: { include: { attachments: true } } },
    orderBy: { createdAt: "desc" },
  });
  return favs.map((f) => toProperty(f.property as Row));
}

export async function addFavorite(userId: string, propertyId: string): Promise<void> {
  await prisma.favorite.upsert({
    where: { userId_propertyId: { userId, propertyId } },
    create: { userId, propertyId },
    update: {},
  });
}

export async function removeFavorite(userId: string, propertyId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, propertyId } });
}
