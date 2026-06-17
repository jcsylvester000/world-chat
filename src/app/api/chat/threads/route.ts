import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/threads?userId=x → my DM threads
export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    return NextResponse.json(await repo.listThreadsForUser(userId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/threads → { a: {id,email}, b: {id,email} } (find or create)
export async function POST(req: Request) {
  try {
    const { a, b } = await req.json();
    return NextResponse.json(await repo.getOrCreateThread(a, b), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
