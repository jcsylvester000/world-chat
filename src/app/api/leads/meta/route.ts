import { NextResponse } from "next/server";
import * as repo from "@/server/repos/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/leads/meta → stages, sources, types for the board + form dropdowns
export async function GET() {
  try {
    const meta = await repo.getLeadMeta();
    return NextResponse.json(meta);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
