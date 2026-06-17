import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/chat/groups/:id → { name }
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { name } = await req.json();
    await repo.renameGroup(id, name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/chat/groups/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await repo.deleteGroup(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
