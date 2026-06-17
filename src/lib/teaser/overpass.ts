// Nearby-business lookup via the OpenStreetMap Overpass API (no key required).
// Used by the Property Teaser to enrich a listing with surrounding amenities.

export interface NearbyCategory {
  key: string;
  label: string;
  selectors: string[]; // Overpass tag selectors, e.g. '["amenity"="restaurant"]'
}

export const NEARBY_CATEGORIES: NearbyCategory[] = [
  { key: "restaurants", label: "Restaurants", selectors: ['["amenity"="restaurant"]', '["amenity"="fast_food"]', '["amenity"="cafe"]'] },
  { key: "malls", label: "Malls", selectors: ['["shop"="mall"]', '["shop"="department_store"]'] },
  { key: "schools", label: "Schools", selectors: ['["amenity"="school"]', '["amenity"="college"]', '["amenity"="university"]'] },
  { key: "hospitals", label: "Hospitals", selectors: ['["amenity"="hospital"]', '["amenity"="clinic"]'] },
  { key: "gas", label: "Gas Stations", selectors: ['["amenity"="fuel"]'] },
  { key: "hotels", label: "Hotels", selectors: ['["tourism"="hotel"]', '["tourism"="motel"]'] },
  { key: "govt", label: "Govt. Buildings", selectors: ['["office"="government"]', '["amenity"="townhall"]'] },
  { key: "fire", label: "Fire Stations", selectors: ['["amenity"="fire_station"]'] },
  { key: "banks", label: "Banks", selectors: ['["amenity"="bank"]'] },
  { key: "warehouses", label: "Warehouses", selectors: ['["building"="warehouse"]', '["industrial"="warehouse"]', '["landuse"="industrial"]'] },
];

export interface NearbyPlace {
  category: string; // category key
  name: string;
  distanceM: number;
}
export interface NearbyResult {
  details: NearbyPlace[];
  summary: { key: string; label: string; count: number }[];
}

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function classify(tags: Record<string, string> | undefined, selected: NearbyCategory[]): string | null {
  if (!tags) return null;
  for (const cat of selected) {
    for (const sel of cat.selectors) {
      const m = sel.match(/\["([^"]+)"="([^"]+)"\]/);
      if (m && tags[m[1]] === m[2]) return cat.key;
    }
  }
  return null;
}

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

interface OverpassEl {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function fetchNearby(
  lat: number,
  lng: number,
  radiusKm: number,
  categoryKeys: string[]
): Promise<NearbyResult> {
  const selected = NEARBY_CATEGORIES.filter((c) => categoryKeys.includes(c.key));
  if (selected.length === 0) return { details: [], summary: [] };
  const radiusM = Math.round(radiusKm * 1000);
  const parts: string[] = [];
  for (const cat of selected) {
    for (const sel of cat.selectors) {
      parts.push(`nwr${sel}(around:${radiusM},${lat},${lng});`);
    }
  }
  const query = `[out:json][timeout:25];(${parts.join("")});out center 120;`;

  let data: { elements: OverpassEl[] } | null = null;
  let lastErr: unknown = null;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(query) });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      data = await res.json();
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!data) throw new Error("Could not reach the OpenStreetMap service. Please try again. " + (lastErr instanceof Error ? lastErr.message : ""));

  const seen = new Set<string>();
  const details: NearbyPlace[] = [];
  for (const el of data.elements ?? []) {
    const key = classify(el.tags, selected);
    if (!key) continue;
    const eLat = el.lat ?? el.center?.lat;
    const eLng = el.lon ?? el.center?.lon;
    if (eLat == null || eLng == null) continue;
    const name = el.tags?.name?.trim() || "(unnamed)";
    const dedup = `${key}|${name}|${Math.round(eLat * 1e4)}|${Math.round(eLng * 1e4)}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    details.push({ category: key, name, distanceM: haversineM(lat, lng, eLat, eLng) });
  }
  details.sort((a, b) => a.distanceM - b.distanceM);

  const summary = selected.map((c) => ({
    key: c.key,
    label: c.label,
    count: details.filter((d) => d.category === c.key).length,
  }));
  return { details, summary };
}

export const categoryLabel = (key: string) => NEARBY_CATEGORIES.find((c) => c.key === key)?.label ?? key;
