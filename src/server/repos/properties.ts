// ─── Prisma-backed Properties repository (SERVER ONLY) ──────────
// Mirrors the listing functions in src/lib/data/services.ts but reads/writes
// PostgreSQL via Prisma. Imported only by the /api route handlers.
//
// The demo clock is a mock-only feature, so expiry here uses the real clock.
import type {
  Property as DbProperty,
  PropertyAttachment as DbAttachment,
  PropertyType as DbPropertyType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { BASIC_LISTING_CAP } from "@/lib/constants";
import { isFreeListingExpired } from "@/lib/billing";
import { matchesListingFilters } from "@/lib/filter";
import type {
  AtsVisibility,
  ListingFilters,
  Paginated,
  Property,
  PropertyAttachment,
  PropertyType,
} from "@/lib/types";

// ── enum mapping (TS labels ↔ Prisma identifiers) ──
const TYPE_TO_DB: Record<PropertyType, DbPropertyType> = {
  Office: "Office",
  Warehouse: "Warehouse",
  Agricultural: "Agricultural",
  "Mixed Use": "MixedUse",
  "Gas Station": "GasStation",
  Retail: "Retail",
};
const TYPE_FROM_DB: Record<DbPropertyType, PropertyType> = {
  Office: "Office",
  Warehouse: "Warehouse",
  Agricultural: "Agricultural",
  MixedUse: "Mixed Use",
  GasStation: "Gas Station",
  Retail: "Retail",
};

type Row = DbProperty & { attachments: DbAttachment[] };

// ── mappers ──
function toProperty(row: Row): Property {
  return {
    id: row.id,
    ownerId: row.ownerId,
    ownerEmail: row.ownerEmail,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    type: TYPE_FROM_DB[row.type],
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    photos: row.photos,
    attachments: row.attachments.map((a) => ({
      id: a.id,
      propertyId: a.propertyId,
      url: a.url,
      filename: a.filename,
    })),
    showPrice: row.showPrice,
    showAttachments: row.showAttachments,
    ats: row.atsUrl && row.atsFilename ? { url: row.atsUrl, filename: row.atsFilename } : null,
    atsVisibility: row.atsVisibility as AtsVisibility,
    requiresLOI: row.requiresLOI,
  };
}

// Build the scalar half of a Prisma create/update payload from a Property-shaped patch.
function toDbData(
  patch: Partial<Omit<Property, "id" | "createdAt" | "attachments">>
): Prisma.PropertyUncheckedUpdateInput {
  const data: Prisma.PropertyUncheckedUpdateInput = {};
  if (patch.ownerId !== undefined) data.ownerId = patch.ownerId;
  if (patch.ownerEmail !== undefined) data.ownerEmail = patch.ownerEmail;
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.price !== undefined) data.price = BigInt(Math.round(patch.price));
  if (patch.location !== undefined) data.location = patch.location;
  if (patch.latitude !== undefined) data.latitude = patch.latitude;
  if (patch.longitude !== undefined) data.longitude = patch.longitude;
  if (patch.type !== undefined) data.type = TYPE_TO_DB[patch.type];
  if (patch.tags !== undefined) data.tags = patch.tags;
  if (patch.photos !== undefined) data.photos = patch.photos;
  if (patch.showPrice !== undefined) data.showPrice = patch.showPrice;
  if (patch.showAttachments !== undefined) data.showAttachments = patch.showAttachments;
  if (patch.atsVisibility !== undefined) data.atsVisibility = patch.atsVisibility;
  if (patch.requiresLOI !== undefined) data.requiresLOI = patch.requiresLOI;
  if (patch.ats !== undefined) {
    data.atsUrl = patch.ats?.url ?? null;
    data.atsFilename = patch.ats?.filename ?? null;
  }
  return data;
}

function isExpired(p: Property, ownerPlan: string, ownerLastActive: Date): boolean {
  if (ownerPlan !== "basic") return false;
  return isFreeListingExpired(p.createdAt, ownerLastActive.toISOString(), new Date());
}

// ── queries ──
const withAttachments = { include: { attachments: true } } as const;

export async function listProperties(): Promise<Property[]> {
  const rows = await prisma.property.findMany({
    include: { attachments: true, owner: { select: { plan: true, lastActiveAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows
    .filter((r) => !isExpired(toProperty(r), r.owner.plan, r.owner.lastActiveAt))
    .map(toProperty);
}

export async function findPropertyById(id: string): Promise<Property | undefined> {
  const row = await prisma.property.findUnique({ where: { id }, ...withAttachments });
  return row ? toProperty(row) : undefined;
}

export async function findVisiblePropertyById(id: string): Promise<Property | undefined> {
  const row = await prisma.property.findUnique({
    where: { id },
    include: { attachments: true, owner: { select: { plan: true, lastActiveAt: true } } },
  });
  if (!row) return undefined;
  const p = toProperty(row);
  return isExpired(p, row.owner.plan, row.owner.lastActiveAt) ? undefined : p;
}

export async function listPropertiesByOwner(ownerId: string): Promise<Property[]> {
  const rows = await prisma.property.findMany({
    where: { ownerId },
    include: { attachments: true, owner: { select: { plan: true, lastActiveAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows
    .filter((r) => !isExpired(toProperty(r), r.owner.plan, r.owner.lastActiveAt))
    .map(toProperty);
}

export async function queryListings(
  filters: ListingFilters,
  page: number,
  perPage: number
): Promise<Paginated<Property>> {
  // Template approach: fetch visible rows then apply the shared TS filter +
  // paginate in JS. For scale, translate ListingFilters into a Prisma `where`.
  const all = await listProperties();
  const filtered = all.filter((p) => matchesListingFilters(p, filters));
  const from = (page - 1) * perPage;
  return { items: filtered.slice(from, from + perPage), totalCount: filtered.length };
}

export async function createProperty(
  input: Omit<Property, "id" | "createdAt" | "attachments"> & {
    attachments?: Omit<PropertyAttachment, "id" | "propertyId">[];
  }
): Promise<Property> {
  // Enforce the Basic listing cap (count non-expired listings).
  const owner = await prisma.profile.findUnique({ where: { id: input.ownerId } });
  if (owner && owner.plan === "basic") {
    const mine = await listPropertiesByOwner(owner.id);
    if (mine.length >= BASIC_LISTING_CAP) {
      throw new Error(
        `Basic plan is limited to ${BASIC_LISTING_CAP} listings. Upgrade to Premium for unlimited listings.`
      );
    }
  }
  const { attachments = [], ...rest } = input;
  const row = await prisma.property.create({
    data: {
      ownerId: rest.ownerId,
      ownerEmail: rest.ownerEmail,
      title: rest.title,
      description: rest.description,
      price: BigInt(Math.round(rest.price)),
      location: rest.location,
      latitude: rest.latitude,
      longitude: rest.longitude,
      type: TYPE_TO_DB[rest.type],
      tags: rest.tags,
      photos: rest.photos,
      showPrice: rest.showPrice,
      showAttachments: rest.showAttachments,
      atsUrl: rest.ats?.url ?? null,
      atsFilename: rest.ats?.filename ?? null,
      atsVisibility: rest.atsVisibility,
      requiresLOI: rest.requiresLOI,
      attachments: { create: attachments.map((a) => ({ url: a.url, filename: a.filename })) },
    },
    ...withAttachments,
  });
  return toProperty(row);
}

export async function updateProperty(
  id: string,
  patch: Partial<Omit<Property, "id" | "createdAt" | "attachments">>
): Promise<Property | undefined> {
  const row = await prisma.property.update({ where: { id }, data: toDbData(patch), ...withAttachments });
  return toProperty(row);
}

export async function deleteProperty(id: string): Promise<void> {
  await prisma.property.delete({ where: { id } });
}
