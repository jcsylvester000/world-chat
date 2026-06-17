import { NextResponse } from "next/server";
import * as repo from "@/server/repos/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reviews?brokerId=x&viewerId=y → rating summary + reviews + eligibility
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const brokerId = url.searchParams.get("brokerId");
    const viewerId = url.searchParams.get("viewerId") ?? undefined;
    if (!brokerId) return NextResponse.json({ error: "brokerId is required" }, { status: 400 });
    return NextResponse.json(await repo.getBrokerReviews(brokerId, viewerId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/reviews → create or update the reviewer's review of a broker
export async function POST(req: Request) {
  try {
    const input = await req.json();
    return NextResponse.json(await repo.upsertReview(input), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
