import { NextResponse } from "next/server";
import * as repo from "@/server/repos/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/presence?userIds=a,b,c → online status for those users
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get("userIds") ?? "";
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return NextResponse.json(await repo.listPresence(ids));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/presence { userId, email } → heartbeat (I'm online now)
export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();
    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email are required" }, { status: 400 });
    }
    await repo.heartbeat(userId, email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
