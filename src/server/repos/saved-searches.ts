// ─── Prisma-backed Saved Searches repository (SERVER ONLY) ──────
// Persists a user's filter sets and computes how many listings have appeared
// that match a saved search since the user last viewed it ("new matches").
import { prisma } from "@/lib/db";
import { listProperties } from "@/server/repos/properties";
import { matchesListingFilters } from "@/lib/filter";
import type { ListingFilters, SavedSearch, SavedSearchWithCount } from "@/lib/types";

function toSaved(row: {
  id: string; userId: string; name: string; filters: unknown;
  notify: boolean; createdAt: Date; lastViewedAt: Date;
}): SavedSearch {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    filters: row.filters as ListingFilters,
    notify: row.notify,
    createdAt: row.createdAt.toISOString(),
    lastViewedAt: row.lastViewedAt.toISOString(),
  };
}

export async function listSavedSearches(userId: string): Promise<SavedSearchWithCount[]> {
  const [rows, properties] = await Promise.all([
    prisma.savedSearch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    listProperties(),
  ]);
  return rows.map((r) => {
    const s = toSaved(r);
    const since = new Date(s.lastViewedAt).getTime();
    const newCount = properties.filter(
      (p) => new Date(p.createdAt).getTime() > since && matchesListingFilters(p, s.filters)
    ).length;
    return { ...s, newCount };
  });
}

export async function createSavedSearch(
  userId: string,
  name: string,
  filters: ListingFilters
): Promise<SavedSearch> {
  const row = await prisma.savedSearch.create({
    data: { userId, name, filters: filters as object },
  });
  return toSaved(row);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await prisma.savedSearch.delete({ where: { id } });
}

// Reset the "new" baseline (called when the user runs/opens the search).
export async function touchSavedSearch(id: string): Promise<void> {
  await prisma.savedSearch.update({ where: { id }, data: { lastViewedAt: new Date() } });
}

export async function setSavedSearchNotify(id: string, notify: boolean): Promise<void> {
  await prisma.savedSearch.update({ where: { id }, data: { notify } });
}
