import { NextResponse } from "next/server";
import * as repo from "@/server/repos/favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/favorites?userId=x → the user's saved listings
export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    return NextResponse.json(await repo.listFavoriteProperties(userId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/favorites → save a listing  ({ userId, propertyId })
export async function POST(req: Request) {
  try {
    const { userId, propertyId } = await req.json();
    if (!userId || !propertyId) return NextResponse.json({ error: "userId and propertyId are required" }, { status: 400 });
    await repo.addFavorite(userId, propertyId);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/favorites → unsave a listing  ({ userId, propertyId })
export async function DELETE(req: Request) {
  try {
    const { userId, propertyId } = await req.json();
    if (!userId || !propertyId) return NextResponse.json({ error: "userId and propertyId are required" }, { status: 400 });
    await repo.removeFavorite(userId, propertyId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
