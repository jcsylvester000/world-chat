import { NextResponse } from "next/server";
import * as repo from "@/server/repos/properties";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/properties/query → filtered + paginated listings.
// Body: { filters: ListingFilters, page: number, perPage: number }
export async function POST(req: Request) {
  try {
    const { filters, page = 1, perPage = 20 } = await req.json();
    const data = await repo.queryListings(filters, page, perPage);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
