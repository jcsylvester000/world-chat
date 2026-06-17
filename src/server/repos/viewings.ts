// ─── Prisma-backed Viewings repository (SERVER ONLY) ────────────
// Property viewing requests: buyer proposes a slot, owner confirms (optionally
// rescheduling) or declines. Imported only by the /api/viewings routes.
import type { Viewing as DbViewing, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Viewing, ViewingStatus } from "@/lib/types";

function toViewing(r: DbViewing): Viewing {
  return {
    id: r.id,
    propertyId: r.propertyId,
    propertyTitle: r.propertyTitle,
    requesterId: r.requesterId,
    requesterName: r.requesterName,
    requesterEmail: r.requesterEmail,
    ownerId: r.ownerId,
    ownerEmail: r.ownerEmail,
    preferredAt: r.preferredAt.toISOString(),
    message: r.message,
    status: r.status as ViewingStatus,
    confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
    ownerNote: r.ownerNote,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listViewingsForOwner(ownerId: string): Promise<Viewing[]> {
  const rows = await prisma.viewing.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
  return rows.map(toViewing);
}

export async function listViewingsForRequester(requesterId: string): Promise<Viewing[]> {
  const rows = await prisma.viewing.findMany({ where: { requesterId }, orderBy: { createdAt: "desc" } });
  return rows.map(toViewing);
}

export type CreateViewingInput = Pick<
  Viewing,
  | "propertyId" | "propertyTitle" | "requesterId" | "requesterName" | "requesterEmail"
  | "ownerId" | "ownerEmail" | "preferredAt" | "message"
>;

export async function createViewing(input: CreateViewingInput): Promise<Viewing> {
  const row = await prisma.viewing.create({
    data: {
      propertyId: input.propertyId,
      propertyTitle: input.propertyTitle,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      ownerId: input.ownerId,
      ownerEmail: input.ownerEmail,
      preferredAt: new Date(input.preferredAt),
      message: input.message,
    },
  });
  return toViewing(row);
}

export async function respondToViewing(
  id: string,
  action: "confirm" | "decline",
  confirmedAt?: string | null,
  ownerNote?: string | null
): Promise<Viewing | undefined> {
  const data: Prisma.ViewingUncheckedUpdateInput =
    action === "confirm"
      ? { status: "confirmed", ownerNote: ownerNote ?? null }
      : { status: "declined", ownerNote: ownerNote ?? null };
  if (action === "confirm") {
    if (confirmedAt) data.confirmedAt = new Date(confirmedAt);
    else {
      const v = await prisma.viewing.findUniqueOrThrow({ where: { id } });
      data.confirmedAt = v.preferredAt;
    }
  }
  const row = await prisma.viewing.update({ where: { id }, data });
  return toViewing(row);
}

export async function cancelViewing(id: string): Promise<Viewing | undefined> {
  const row = await prisma.viewing.update({ where: { id }, data: { status: "cancelled" } });
  return toViewing(row);
}
