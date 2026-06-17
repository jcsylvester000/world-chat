// ─── Prisma-backed Leads repository (SERVER ONLY) ───────────────
// Mirrors the lead functions in src/lib/data/services.ts but reads/writes
// PostgreSQL via Prisma. Imported only by the /api/leads route handlers.
import type { Lead as DbLead, LeadActivity as DbLeadActivity, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Lead, LeadActivity, LeadActivityType, LeadMeta, LeadStatus } from "@/lib/types";

// ── mappers ──
function toLead(row: DbLead): Lead {
  return {
    id: row.id,
    ownerId: row.ownerId,
    ownerEmail: row.ownerEmail,
    title: row.title,
    description: row.description,
    value: Number(row.value),
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    propertyId: row.propertyId,
    propertyTitle: row.propertyTitle,
    sourceId: row.sourceId,
    typeId: row.typeId,
    stageId: row.stageId,
    status: row.status as LeadStatus,
    expectedCloseDate: row.expectedCloseDate ? row.expectedCloseDate.toISOString() : null,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    lostReason: row.lostReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDbData(
  patch: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt">>
): Prisma.LeadUncheckedUpdateInput {
  const d: Prisma.LeadUncheckedUpdateInput = {};
  if (patch.ownerId !== undefined) d.ownerId = patch.ownerId;
  if (patch.ownerEmail !== undefined) d.ownerEmail = patch.ownerEmail;
  if (patch.title !== undefined) d.title = patch.title;
  if (patch.description !== undefined) d.description = patch.description;
  if (patch.value !== undefined) d.value = BigInt(Math.round(patch.value));
  if (patch.contactName !== undefined) d.contactName = patch.contactName;
  if (patch.contactEmail !== undefined) d.contactEmail = patch.contactEmail;
  if (patch.contactPhone !== undefined) d.contactPhone = patch.contactPhone;
  if (patch.propertyId !== undefined) d.propertyId = patch.propertyId;
  if (patch.propertyTitle !== undefined) d.propertyTitle = patch.propertyTitle;
  if (patch.sourceId !== undefined) d.sourceId = patch.sourceId;
  if (patch.typeId !== undefined) d.typeId = patch.typeId;
  if (patch.stageId !== undefined) d.stageId = patch.stageId;
  if (patch.status !== undefined) d.status = patch.status;
  if (patch.expectedCloseDate !== undefined)
    d.expectedCloseDate = patch.expectedCloseDate ? new Date(patch.expectedCloseDate) : null;
  if (patch.closedAt !== undefined) d.closedAt = patch.closedAt ? new Date(patch.closedAt) : null;
  if (patch.lostReason !== undefined) d.lostReason = patch.lostReason;
  return d;
}

// ── queries ──
export async function getLeadMeta(): Promise<LeadMeta> {
  const [stages, sources, types] = await Promise.all([
    prisma.leadStage.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.leadSource.findMany({ orderBy: { name: "asc" } }),
    prisma.leadType.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { stages, sources, types };
}

export async function listLeadsByOwner(ownerId: string): Promise<Lead[]> {
  const rows = await prisma.lead.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: {
      activities: { where: { done: false, dueAt: { not: null } }, orderBy: { dueAt: "asc" }, take: 1 },
    },
  });
  return rows.map((r) => ({ ...toLead(r), nextActionAt: r.activities[0]?.dueAt?.toISOString() ?? null }));
}

// ── lead activities & follow-ups ──
function toActivity(a: DbLeadActivity): LeadActivity {
  return {
    id: a.id,
    leadId: a.leadId,
    type: a.type as LeadActivityType,
    note: a.note,
    dueAt: a.dueAt ? a.dueAt.toISOString() : null,
    done: a.done,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function listLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const rows = await prisma.leadActivity.findMany({ where: { leadId }, orderBy: { createdAt: "desc" } });
  return rows.map(toActivity);
}

export type AddActivityInput = { leadId: string; type: LeadActivityType; note: string; dueAt?: string | null };

export async function addLeadActivity(input: AddActivityInput): Promise<LeadActivity> {
  const row = await prisma.leadActivity.create({
    data: { leadId: input.leadId, type: input.type, note: input.note, dueAt: input.dueAt ? new Date(input.dueAt) : null },
  });
  return toActivity(row);
}

export async function setLeadActivityDone(id: string, done: boolean): Promise<LeadActivity> {
  const row = await prisma.leadActivity.update({ where: { id }, data: { done } });
  return toActivity(row);
}

export async function deleteLeadActivity(id: string): Promise<void> {
  await prisma.leadActivity.delete({ where: { id } });
}

export async function createLead(
  input: Omit<Lead, "id" | "createdAt" | "updatedAt">
): Promise<Lead> {
  const row = await prisma.lead.create({
    data: {
      ownerId: input.ownerId,
      ownerEmail: input.ownerEmail,
      title: input.title,
      description: input.description,
      value: BigInt(Math.round(input.value)),
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      propertyId: input.propertyId,
      propertyTitle: input.propertyTitle,
      sourceId: input.sourceId,
      typeId: input.typeId,
      stageId: input.stageId,
      status: input.status,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      closedAt: input.closedAt ? new Date(input.closedAt) : null,
      lostReason: input.lostReason,
    },
  });
  return toLead(row);
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt">>
): Promise<Lead | undefined> {
  const row = await prisma.lead.update({ where: { id }, data: toDbData(patch) });
  return toLead(row);
}

// Move a lead to a stage; derive status/closedAt/lostReason from the target.
export async function updateLeadStage(
  id: string,
  stageId: string,
  lostReason?: string | null
): Promise<Lead | undefined> {
  const stage = await prisma.leadStage.findUniqueOrThrow({ where: { id: stageId } });
  const status: LeadStatus = stage.isWon ? "won" : stage.isLost ? "lost" : "open";
  const row = await prisma.lead.update({
    where: { id },
    data: {
      stageId,
      status,
      closedAt: stage.isWon || stage.isLost ? new Date() : null,
      lostReason: stage.isLost ? (lostReason ?? null) : null,
    },
  });
  return toLead(row);
}

export async function deleteLead(id: string): Promise<void> {
  await prisma.lead.delete({ where: { id } });
}
