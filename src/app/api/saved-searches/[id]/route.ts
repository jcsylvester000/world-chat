import { NextResponse } from "next/server";
import * as repo from "@/server/repos/saved-searches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/saved-searches/:id → { markViewed?: true, notify?: boolean }
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.markViewed) await repo.touchSavedSearch(id);
    if (typeof body.notify === "boolean") await repo.setSavedSearchNotify(id, body.notify);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/saved-searches/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await repo.deleteSavedSearch(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
