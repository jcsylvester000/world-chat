import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Same-origin proxy for an OpenStreetMap static map image, so the Property
// Teaser can draw the map onto a canvas (for PNG/PDF export) without tripping
// cross-origin canvas-taint restrictions.
export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const lat = Number(u.searchParams.get("lat"));
    const lng = Number(u.searchParams.get("lng"));
    const zoom = Math.min(18, Math.max(1, Number(u.searchParams.get("zoom") || 14)));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
    }
    const src = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=600x320&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
    const upstream = await fetch(src, { headers: { "User-Agent": "WorldChat-PropertyTeaser/1.0" } });
    if (!upstream.ok) return NextResponse.json({ error: "map unavailable" }, { status: 502 });
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      headers: {
        "content-type": upstream.headers.get("content-type") || "image/png",
        "cache-control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
