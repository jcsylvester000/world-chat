import { NextResponse } from "next/server";
import * as repo from "@/server/repos/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/typing?conversationId=x&excludeUserId=me → who's typing
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");
    const excludeUserId = url.searchParams.get("excludeUserId") ?? undefined;
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }
    return NextResponse.json(await repo.listTyping(conversationId, excludeUserId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/typing { conversationId, userId, email } → I'm typing
export async function POST(req: Request) {
  try {
    const { conversationId, userId, email } = await req.json();
    if (!conversationId || !userId || !email) {
      return NextResponse.json({ error: "conversationId, userId and email are required" }, { status: 400 });
    }
    await repo.setTyping(conversationId, userId, email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/chat/typing?conversationId=x&userId=me → I stopped typing
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");
    const userId = url.searchParams.get("userId");
    if (!conversationId || !userId) {
      return NextResponse.json({ error: "conversationId and userId are required" }, { status: 400 });
    }
    await repo.clearTyping(conversationId, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
