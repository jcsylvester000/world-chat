import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Plan = "basic" | "premium" | undefined;

// GET /api/chat/world?plan=premium
export async function GET(req: Request) {
  try {
    const plan = (new URL(req.url).searchParams.get("plan") as Plan) ?? undefined;
    return NextResponse.json(await repo.listWorldMessages(plan));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/world → world message payload (Premium-only)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json(await repo.sendWorldMessage(body), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
