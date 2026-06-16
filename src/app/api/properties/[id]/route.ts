import { NextResponse } from "next/server";
import * as repo from "@/server/repos/properties";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/properties/:id → a single visible listing (404 if missing/expired)
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const p = await repo.findVisiblePropertyById(id);
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(p);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// PATCH /api/properties/:id → update (body = partial patch)
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const patch = await req.json();
    const updated = await repo.updateProperty(id, patch);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/properties/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await repo.deleteProperty(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
