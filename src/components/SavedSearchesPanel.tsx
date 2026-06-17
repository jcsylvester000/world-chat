"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/store/auth-store";
import { useSavedSearchesStore } from "@/lib/store/saved-searches-store";
import { useListingsStore } from "@/lib/store/listings-store";
import { formatPesoCompact } from "@/lib/utils";
import type { ListingFilters, SavedSearchWithCount } from "@/lib/types";

function summarize(f: ListingFilters): string {
  const parts: string[] = [];
  parts.push(f.type || "All types");
  if (f.searchText) parts.push(`“${f.searchText}”`);
  if (f.minPrice > 0 || (f.maxPrice > 0 && f.maxPrice < 99_999_999))
    parts.push(`${formatPesoCompact(f.minPrice)}–${formatPesoCompact(f.maxPrice)}`);
  if (f.selectedTags.length) parts.push(`${f.selectedTags.length} tag${f.selectedTags.length > 1 ? "s" : ""}`);
  if (f.hasAts === "with") parts.push("with ATS");
  if (f.hasAts === "without") parts.push("no ATS");
  return parts.join(" · ");
}

export default function SavedSearchesPanel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const searches = useSavedSearchesStore((s) => s.searches);
  const loaded = useSavedSearchesStore((s) => s.loaded);
  const fetch = useSavedSearchesStore((s) => s.fetch);
  const remove = useSavedSearchesStore((s) => s.remove);
  const markViewed = useSavedSearchesStore((s) => s.markViewed);
  const setFilters = useListingsStore((s) => s.setFilters);

  useEffect(() => {
    if (user && !loaded) fetch(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const run = async (s: SavedSearchWithCount) => {
    markViewed(s.id);
    await setFilters(s.filters);
    router.push("/all-listings");
  };

  if (!loaded) return <div className="flex justify-center py-16"><Spinner /></div>;

  if (searches.length === 0) {
    return (
      <EmptyState
        icon="🔔"
        title="No saved searches yet"
        description="On Browse, set your filters and tap “Save search” to track new matching listings here."
        action={<Link href="/all-listings" className="btn-primary">Browse listings</Link>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-ink">{s.name}</p>
              {s.newCount > 0 && (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                  {s.newCount} new
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">{summarize(s.filters)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => run(s)} className="btn-primary !px-3 !py-1.5 text-xs">
              View{s.newCount > 0 ? ` (${s.newCount} new)` : ""}
            </button>
            <button
              onClick={() => remove(s.id)}
              className="rounded-md border border-line px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
