import { NextResponse } from "next/server";
import * as repo from "@/server/repos/viewings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/viewings/:id → { action: "confirm" | "decline" | "cancel", confirmedAt?, ownerNote? }
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { action, confirmedAt, ownerNote } = await req.json();
    let updated;
    if (action === "cancel") updated = await repo.cancelViewing(id);
    else if (action === "confirm" || action === "decline")
      updated = await repo.respondToViewing(id, action, confirmedAt ?? null, ownerNote ?? null);
    else return NextResponse.json({ error: "invalid action" }, { status: 400 });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
