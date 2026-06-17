import { NextResponse } from "next/server";
import * as repo from "@/server/repos/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/leads/:id/activities → the lead's activity log
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return NextResponse.json(await repo.listLeadActivities(id));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/leads/:id/activities → log an activity / follow-up  ({ type, note, dueAt? })
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { type, note, dueAt } = await req.json();
    const created = await repo.addLeadActivity({ leadId: id, type, note: note ?? "", dueAt: dueAt ?? null });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
