import { NextResponse } from "next/server";
import * as repo from "@/server/repos/viewings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/viewings?ownerId=x  → viewings for my listings (owner view)
// GET /api/viewings?requesterId=x → viewings I requested (buyer view)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get("ownerId");
    const requesterId = url.searchParams.get("requesterId");
    if (ownerId) return NextResponse.json(await repo.listViewingsForOwner(ownerId));
    if (requesterId) return NextResponse.json(await repo.listViewingsForRequester(requesterId));
    return NextResponse.json({ error: "ownerId or requesterId is required" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/viewings → request a viewing
export async function POST(req: Request) {
  try {
    const input = await req.json();
    return NextResponse.json(await repo.createViewing(input), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
