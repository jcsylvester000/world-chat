// Seed PostgreSQL with the same demo data the mock layer ships with.
// Run with `npm run db:seed` (wired to `tsx prisma/seed.ts` via package.json).
//
// Scope: this seeds the Profiles + Properties slice (what the /api listings
// endpoints serve). Extend the same way for the remaining entities as you
// migrate each feature (payments, invoices, tickets, AI requests, chat, etc.).
import { PrismaClient, type PropertyType as DbPropertyType } from "@prisma/client";
import { profiles, properties } from "@/lib/data/mock-data";
import type { PropertyType } from "@/lib/types";

const prisma = new PrismaClient();

const TYPE_TO_DB: Record<PropertyType, DbPropertyType> = {
  Office: "Office",
  Warehouse: "Warehouse",
  Agricultural: "Agricultural",
  "Mixed Use": "MixedUse",
  "Gas Station": "GasStation",
  Retail: "Retail",
};

async function main() {
  // Clear in dependency order (dev seed — safe to wipe).
  await prisma.propertyAttachment.deleteMany();
  await prisma.property.deleteMany();
  await prisma.profile.deleteMany();

  for (const u of profiles) {
    await prisma.profile.create({
      data: {
        id: u.id,
        email: u.email,
        username: u.username,
        plan: u.plan,
        isAdmin: u.isAdmin,
        defaultShowPrice: u.defaultShowPrice,
        defaultShowAttachments: u.defaultShowAttachments,
        code: u.code,
        chatVisibility: u.chatVisibility,
        allowFriendRequests: u.allowFriendRequests,
        active: u.active,
        planInterval: u.planInterval ?? undefined,
        planRenewsAt: u.planRenewsAt ? new Date(u.planRenewsAt) : undefined,
        lastActiveAt: new Date(u.lastActiveAt),
      },
    });
  }

  for (const p of properties) {
    await prisma.property.create({
      data: {
        id: p.id,
        ownerId: p.ownerId,
        ownerEmail: p.ownerEmail,
        title: p.title,
        description: p.description,
        price: BigInt(Math.round(p.price)),
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        type: TYPE_TO_DB[p.type],
        tags: p.tags,
        photos: p.photos,
        showPrice: p.showPrice,
        showAttachments: p.showAttachments,
        atsUrl: p.ats?.url ?? null,
        atsFilename: p.ats?.filename ?? null,
        atsVisibility: p.atsVisibility,
        requiresLOI: p.requiresLOI,
        createdAt: new Date(p.createdAt),
        attachments: {
          create: p.attachments.map((a) => ({ url: a.url, filename: a.filename })),
        },
      },
    });
  }

  console.log(`✅ Seeded ${profiles.length} profiles and ${properties.length} properties.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
