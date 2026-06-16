"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import FiltersBar from "@/components/FiltersBar";
import ChatPanel from "@/components/ChatPanel";
import PropertyListItem from "@/components/PropertyListItem";
import Modal from "@/components/Modal";
import AddPropertyForm from "@/components/AddPropertyForm";
import BillingNotice from "@/components/BillingNotice";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/lib/store/auth-store";
import { usePropertyStore } from "@/lib/store/property-store";
import { useListingsStore } from "@/lib/store/listings-store";
import { matchesListingFilters } from "@/lib/filter";
import { BASIC_LISTING_CAP } from "@/lib/constants";

const PAGE_SIZE = 20;

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-slate-100 text-slate-400">Loading map…</div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const properties = usePropertyStore((s) => s.properties);
  const loading = usePropertyStore((s) => s.loading);
  const fetchProperties = usePropertyStore((s) => s.fetch);
  const filters = useListingsStore((s) => s.filters);

  const [showAdd, setShowAdd] = useState(false);
  const myCount = properties.filter((p) => p.ownerId === user?.id).length;
  const atCap = user?.plan === "basic" && myCount >= BASIC_LISTING_CAP;
  const startAdd = () => {
    if (atCap) {
      setToast(`You've reached the Basic limit of ${BASIC_LISTING_CAP} listings — redirecting to upgrade…`);
      setTimeout(() => router.push("/subscription"), 1300);
    } else {
      setShowAdd(true);
    }
  };
  const [focusId, setFocusId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    fetchProperties();
    if (typeof window !== "undefined" && !localStorage.getItem("wc-welcomed")) setWelcome(true);
  }, [fetchProperties]);

  const dismissWelcome = () => {
    setWelcome(false);
    localStorage.setItem("wc-welcomed", "1");
  };

  const dm = useCallback((ownerId: string) => router.push(`/messages?to=${ownerId}`), [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter(
      (p) =>
        matchesListingFilters(p, filters) &&
        (!q ||
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [properties, filters, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col p-4 sm:p-6">
      {toast && (
        <div className="mb-4 rounded-lg bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>
      )}

      {welcome && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4">
          <div>
            <p className="text-sm font-semibold text-ink">👋 Welcome to WorldChat</p>
            <p className="text-sm text-slate-600">
              Browse properties on the map, chat with owners in the panel, or list your own with{" "}
              <strong>+ Add property</strong>. Track everything under <strong>My Listings</strong>.
            </p>
          </div>
          <button onClick={dismissWelcome} aria-label="Dismiss" className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      <div className="mb-4"><BillingNotice dismissible /></div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Explore the market</h1>
          <p className="text-sm text-slate-500">{properties.length} properties on the map across Metro Manila &amp; beyond</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters((v) => !v)} className="btn-outline">{showFilters ? "Hide filters" : "Filters"}</button>
          <button onClick={startAdd} className="btn-accent">+ Add property</button>
        </div>
      </div>

      {showFilters && (<div className="mb-4"><FiltersBar /></div>)}

      <div className="space-y-4 lg:grid lg:h-[calc(100vh-12rem)] lg:grid-cols-3 lg:gap-4 lg:space-y-0">
        <div className="h-[58vh] overflow-hidden rounded-2xl border border-line shadow-sm lg:order-2 lg:h-full">
          <PropertyMap properties={filtered} focusId={focusId} onMarkerClick={(id) => router.push(`/listings/${id}`)} />
        </div>

        <div className="h-[460px] lg:order-1 lg:h-full"><ChatPanel /></div>

        <div className="flex flex-col rounded-2xl border border-line bg-white shadow-sm lg:order-3 lg:h-full lg:overflow-hidden">
          <div className="space-y-2 border-b border-line p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Newest listings</h2>
              <span className="text-xs text-slate-400">{filtered.length} found</span>
            </div>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search listings…" className="input !py-1.5 text-sm" />
          </div>

          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {loading && properties.length === 0 ? (
              <Spinner />
            ) : pageItems.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">No listings match.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-1">
                {pageItems.map((p) => (
                  <div key={p.id} onMouseEnter={() => setFocusId(p.id)} onMouseLeave={() => setFocusId(null)}>
                    <PropertyListItem property={p} onDm={dm} currentUserId={user?.id} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-3 py-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="btn-outline !px-3 !py-1 text-xs">← Prev</button>
              <span className="text-xs text-slate-500">Page {safePage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="btn-outline !px-3 !py-1 text-xs">Next →</button>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} className="!max-w-2xl">
          <AddPropertyForm onAdded={() => { setShowAdd(false); setToast("✅ Property added!"); setTimeout(() => setToast(""), 2500); }} />
        </Modal>
      )}
    </div>
  );
}
