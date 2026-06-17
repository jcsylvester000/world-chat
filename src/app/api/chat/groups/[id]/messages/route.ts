import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type Plan = "basic" | "premium" | undefined;

// GET /api/chat/groups/:id/messages?plan=premium
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const plan = (new URL(req.url).searchParams.get("plan") as Plan) ?? undefined;
    return NextResponse.json(await repo.listGroupMessages(id, plan));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/groups/:id/messages → group message payload
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    return NextResponse.json(await repo.sendGroupMessage({ ...body, groupId: id }), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
