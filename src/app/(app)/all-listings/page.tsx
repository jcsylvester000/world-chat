"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import FiltersBar from "@/components/FiltersBar";
import PropertyCard from "@/components/PropertyCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useListingsStore } from "@/lib/store/listings-store";
import { useAuthStore } from "@/lib/store/auth-store";

export default function AllListingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { items, totalCount, page, perPage, loading, fetch, setPage } =
    useListingsStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const dm = useCallback(
    (ownerId: string) => router.push(`/messages?to=${ownerId}`),
    [router]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Browse listings</h1>
        <p className="text-sm text-slate-500">
          {totalCount} {totalCount === 1 ? "property" : "properties"} available
        </p>
      </div>

      <FiltersBar />

      {loading && items.length === 0 ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matches"
          description="Try widening your price range or clearing some filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <PropertyCard key={p.id} property={p} onDm={dm} currentUserId={user?.id} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-outline"
              >
                ← Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="btn-outline"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
