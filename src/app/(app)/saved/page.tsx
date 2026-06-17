"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import SavedSearchesPanel from "@/components/SavedSearchesPanel";
import { useAuthStore } from "@/lib/store/auth-store";
import { useFavoritesStore } from "@/lib/store/favorites-store";
import { useSavedSearchesStore } from "@/lib/store/saved-searches-store";
import { cn } from "@/lib/utils";

export default function SavedPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const properties = useFavoritesStore((s) => s.properties);
  const favLoaded = useFavoritesStore((s) => s.loaded);
  const fetchFav = useFavoritesStore((s) => s.fetch);
  const searches = useSavedSearchesStore((s) => s.searches);
  const fetchSearches = useSavedSearchesStore((s) => s.fetch);
  const searchesLoaded = useSavedSearchesStore((s) => s.loaded);

  const [tab, setTab] = useState<"listings" | "searches">("listings");

  useEffect(() => {
    if (user) {
      fetchFav(user.id);
      if (!searchesLoaded) fetchSearches(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const totalNew = searches.reduce((n, s) => n + s.newCount, 0);

  if (!hasHydrated || !user) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Saved</h1>
        <p className="text-sm text-slate-500">Your shortlisted listings and saved searches.</p>
      </header>

      <div className="mb-5 flex gap-1 border-b border-line">
        <button
          onClick={() => setTab("listings")}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
            tab === "listings" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink"
          )}
        >
          Listings{properties.length ? ` (${properties.length})` : ""}
        </button>
        <button
          onClick={() => setTab("searches")}
          className={cn(
            "-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium",
            tab === "searches" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink"
          )}
        >
          Searches
          {totalNew > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">{totalNew}</span>
          )}
        </button>
      </div>

      {tab === "listings" ? (
        !favLoaded ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon="🤍"
            title="No saved listings yet"
            description="Browse the marketplace and tap the heart on any property to save it here for later."
            action={<Link href="/all-listings" className="btn-primary">Browse listings</Link>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} currentUserId={user.id} />
            ))}
          </div>
        )
      ) : (
        <SavedSearchesPanel />
      )}
    </div>
  );
}
