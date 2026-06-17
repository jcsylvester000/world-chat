import { NextResponse } from "next/server";
import * as repo from "@/server/repos/teaser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/teaser/drafts?userId=x → the user's saved teaser drafts
export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    return NextResponse.json(await repo.listDrafts(userId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/teaser/drafts → { userId, id?, title, data } (create or update; Basic cap enforced)
export async function POST(req: Request) {
  try {
    const { userId, id, title, data } = await req.json();
    if (!userId || !data) return NextResponse.json({ error: "userId and data are required" }, { status: 400 });
    return NextResponse.json(await repo.saveDraft(userId, { id, title: title || "Untitled listing", data }), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
