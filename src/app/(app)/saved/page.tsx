"use client";

import { useEffect } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/store/auth-store";
import { useFavoritesStore } from "@/lib/store/favorites-store";

export default function SavedPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const properties = useFavoritesStore((s) => s.properties);
  const loaded = useFavoritesStore((s) => s.loaded);
  const fetch = useFavoritesStore((s) => s.fetch);

  useEffect(() => {
    if (user) fetch(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetch]);

  if (!hasHydrated || !user) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Saved listings</h1>
        <p className="text-sm text-slate-500">
          Properties you&apos;ve shortlisted. Tap the heart on any listing to add or remove it.
        </p>
      </header>

      {!loaded ? (
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
      )}
    </div>
  );
}
