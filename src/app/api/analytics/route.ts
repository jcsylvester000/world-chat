import { NextResponse } from "next/server";
import { getBrokerAnalytics } from "@/server/repos/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/analytics?ownerId=x → per-listing metrics + pipeline funnel
export async function GET(req: Request) {
  try {
    const ownerId = new URL(req.url).searchParams.get("ownerId");
    if (!ownerId) return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
    return NextResponse.json(await getBrokerAnalytics(ownerId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
