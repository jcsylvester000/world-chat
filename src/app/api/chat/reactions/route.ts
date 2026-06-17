import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/reactions?messageIds=a,b,c → reactions for those messages
export async function GET(req: Request) {
  try {
    const raw = new URL(req.url).searchParams.get("messageIds") ?? "";
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return NextResponse.json(await repo.listReactions(ids));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/reactions → { messageId, userId, userEmail, emoji } (toggle)
export async function POST(req: Request) {
  try {
    const { messageId, userId, userEmail, emoji } = await req.json();
    await repo.toggleReaction(messageId, userId, userEmail, emoji);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
