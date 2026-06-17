import { NextResponse } from "next/server";
import * as repo from "@/server/repos/saved-searches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/saved-searches?userId=x → saved searches + new-match counts
export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    return NextResponse.json(await repo.listSavedSearches(userId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/saved-searches → { userId, name, filters }
export async function POST(req: Request) {
  try {
    const { userId, name, filters } = await req.json();
    if (!userId || !name || !filters)
      return NextResponse.json({ error: "userId, name and filters are required" }, { status: 400 });
    return NextResponse.json(await repo.createSavedSearch(userId, name, filters), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
