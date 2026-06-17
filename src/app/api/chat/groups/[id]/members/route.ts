import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/chat/groups/:id/members
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return NextResponse.json(await repo.listGroupMembers(id));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/groups/:id/members → { userId }
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { userId } = await req.json();
    await repo.addGroupMember(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/chat/groups/:id/members?userId=x
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    await repo.removeGroupMember(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
