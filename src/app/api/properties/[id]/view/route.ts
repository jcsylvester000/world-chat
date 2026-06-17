import { NextResponse } from "next/server";
import * as repo from "@/server/repos/properties";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/properties/:id/view → increment the listing's view count
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await repo.incrementPropertyViews(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
