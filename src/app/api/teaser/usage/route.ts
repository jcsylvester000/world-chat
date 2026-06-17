import { NextResponse } from "next/server";
import * as repo from "@/server/repos/teaser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/teaser/usage?userId=x → { count, unlimited }
export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    return NextResponse.json(await repo.getUsage(userId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/teaser/usage → { userId } : record one export (enforces Basic cap)
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    return NextResponse.json(await repo.recordUse(userId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
