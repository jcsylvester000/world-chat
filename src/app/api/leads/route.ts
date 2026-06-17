import { NextResponse } from "next/server";
import * as repo from "@/server/repos/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/leads?ownerId=x → a broker's leads (board data)
export async function GET(req: Request) {
  try {
    const ownerId = new URL(req.url).searchParams.get("ownerId");
    if (!ownerId) return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
    const data = await repo.listLeadsByOwner(ownerId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/leads → create a lead
export async function POST(req: Request) {
  try {
    const input = await req.json();
    const created = await repo.createLead(input);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
