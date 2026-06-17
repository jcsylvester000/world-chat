import { NextResponse } from "next/server";
import * as repo from "@/server/repos/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/lead-activities/:id → { done: boolean }  (toggle a follow-up done)
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { done } = await req.json();
    return NextResponse.json(await repo.setLeadActivityDone(id, !!done));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/lead-activities/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await repo.deleteLeadActivity(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
