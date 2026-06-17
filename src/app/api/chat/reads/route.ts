import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/reads?userId=x → my last-read markers per conversation
export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    return NextResponse.json(await repo.listReads(userId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/reads → { userId, conversationId } (mark read now)
export async function POST(req: Request) {
  try {
    const { userId, conversationId } = await req.json();
    await repo.markRead(userId, conversationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
