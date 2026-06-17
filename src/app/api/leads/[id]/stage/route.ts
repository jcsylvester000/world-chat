import { NextResponse } from "next/server";
import * as repo from "@/server/repos/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/leads/:id/stage → move a lead to a stage (drag-and-drop).
// Body: { stageId: string, lostReason?: string }
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { stageId, lostReason } = await req.json();
    if (!stageId) return NextResponse.json({ error: "stageId is required" }, { status: 400 });
    const updated = await repo.updateLeadStage(id, stageId, lostReason ?? null);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
