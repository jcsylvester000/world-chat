import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type Scope = "group" | "world" | "direct";

async function edit(scope: Scope, id: string, content: string) {
  if (scope === "group") return repo.editGroupMessage(id, content);
  if (scope === "world") return repo.editWorldMessage(id, content);
  return repo.editDirectMessage(id, content);
}
async function remove(scope: Scope, id: string) {
  if (scope === "group") return repo.deleteGroupMessage(id);
  if (scope === "world") return repo.deleteWorldMessage(id);
  return repo.deleteDirectMessage(id);
}

// PATCH /api/chat/messages/:id → { scope, content } (edit own message)
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { scope, content } = await req.json();
    await edit(scope as Scope, id, content);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/chat/messages/:id?scope=group → soft-delete own message
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const scope = new URL(req.url).searchParams.get("scope") as Scope;
    await remove(scope, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
