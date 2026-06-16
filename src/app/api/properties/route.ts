import { NextResponse } from "next/server";
import * as repo from "@/server/repos/properties";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/properties            → marketplace listings (non-expired)
// GET /api/properties?ownerId=x  → a single owner's listings
export async function GET(req: Request) {
  try {
    const ownerId = new URL(req.url).searchParams.get("ownerId");
    const data = ownerId ? await repo.listPropertiesByOwner(ownerId) : await repo.listProperties();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/properties → create a listing (body = the create input)
export async function POST(req: Request) {
  try {
    const input = await req.json();
    const created = await repo.createProperty(input);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    // The Basic listing-cap throw surfaces here as a 400.
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
