import { NextResponse } from "next/server";
import * as repo from "@/server/repos/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/leads/:id → update lead fields (body = partial patch)
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const patch = await req.json();
    const updated = await repo.updateLead(id, patch);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/leads/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await repo.deleteLead(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
