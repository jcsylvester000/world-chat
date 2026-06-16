import type { ListingFilters, Property } from "./types";

export const hasVisibleAts = (p: Property) =>
  p.ats !== null && p.atsVisibility !== "hidden";

// Shared listing-filter predicate used by both the Browse query and the
// dashboard, so filtering behaves identically everywhere.
export function matchesListingFilters(p: Property, f: ListingFilters): boolean {
  const search = f.searchText.trim().toLowerCase();
  if (
    search &&
    !p.location.toLowerCase().includes(search) &&
    !p.title.toLowerCase().includes(search) &&
    !p.tags.some((t) => t.toLowerCase().includes(search))
  )
    return false;
  if (f.type && p.type !== f.type) return false;
  if (p.price < f.minPrice || p.price > f.maxPrice) return false;
  if (f.selectedTags.length && !f.selectedTags.every((t) => p.tags.includes(t)))
    return false;
  if (f.hasAts === "with" && !hasVisibleAts(p)) return false;
  if (f.hasAts === "without" && hasVisibleAts(p)) return false;
  return true;
}
