import { NextResponse } from "next/server";
import * as repo from "@/server/repos/teaser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/teaser/drafts/:id?userId=x
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    await repo.deleteDraft(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
