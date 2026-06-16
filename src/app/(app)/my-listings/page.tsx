"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";
import AddPropertyForm from "@/components/AddPropertyForm";
import PropertyCard from "@/components/PropertyCard";
import RequestsPanel from "@/components/RequestsPanel";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import BillingNotice from "@/components/BillingNotice";
import { cn } from "@/lib/utils";
import { BASIC_LISTING_CAP } from "@/lib/constants";
import { useAuthStore } from "@/lib/store/auth-store";
import { usePropertyStore } from "@/lib/store/property-store";
import { useRequestsStore } from "@/lib/store/requests-store";
import type { Property } from "@/lib/types";

function HubInner() {
  const params = useSearchParams();
  const router = useRouter();
  const openId = params.get("open");
  const initialTab: "listings" | "requests" =
    params.get("tab") === "requests" || openId ? "requests" : "listings";

  const user = useAuthStore((s) => s.user);
  const myProperties = usePropertyStore((s) => s.myProperties);
  const fetchMine = usePropertyStore((s) => s.fetchMine);
  const remove = usePropertyStore((s) => s.remove);
  const ownerRequests = useRequestsStore((s) => s.ownerRequests);
  const fetchOwner = useRequestsStore((s) => s.fetchOwner);

  const [tab, setTab] = useState<"listings" | "requests">(initialTab);
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);
  const [toast, setToast] = useState("");

  const isBasic = user?.plan === "basic";
  const atCap = isBasic && myProperties.length >= BASIC_LISTING_CAP;
  const startAdd = () => (atCap ? setShowUpgrade(true) : setShowAdd(true));

  useEffect(() => {
    if (user) {
      fetchMine(user.id).then(() => setReady(true));
      fetchOwner(user.id);
    }
  }, [user, fetchMine, fetchOwner]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };
  const switchTab = (t: "listings" | "requests") => {
    setTab(t);
    router.replace(t === "requests" ? "/my-listings?tab=requests" : "/my-listings");
  };
  const confirmDelete = async () => {
    if (deleting && user) {
      await remove(deleting.id, user.id);
      setDeleting(null);
      flash("🗑️ Listing deleted.");
    }
  };

  const pending = ownerRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      {toast && <div className="rounded-lg bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>}

      <BillingNotice dismissible />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My listings &amp; requests</h1>
        {tab === "listings" && (
          <div className="flex items-center gap-3">
            {isBasic && (
              <span
                className={cn(
                  "text-sm font-medium",
                  atCap ? "text-danger" : "text-slate-500"
                )}
              >
                {myProperties.length}/{BASIC_LISTING_CAP} listings · Basic
              </span>
            )}
            <button onClick={startAdd} className="btn-accent">+ Add property</button>
          </div>
        )}
      </div>

      {atCap && tab === "listings" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <span className="text-amber-800">
            You&apos;ve reached the Basic limit of {BASIC_LISTING_CAP} listings.
          </span>
          <button onClick={() => router.push("/subscription")} className="btn-primary !py-1.5 text-xs">
            Upgrade to Premium
          </button>
        </div>
      )}

      <div className="flex gap-1 border-b border-line">
        <button onClick={() => switchTab("listings")} className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-medium transition", tab === "listings" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink")}>
          Listings ({myProperties.length})
        </button>
        <button onClick={() => switchTab("requests")} className={cn("-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition", tab === "requests" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink")}>
          Requests
          {pending > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{pending}</span>}
        </button>
      </div>

      {tab === "listings" ? (
        !ready ? (
          <Spinner />
        ) : myProperties.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="You have no listings yet"
            description="Publish your first property to put it on the map and in front of buyers."
            action={<button onClick={startAdd} className="btn-primary">+ Add your first property</button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myProperties.map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <PropertyCard property={p} />
                <div className="flex gap-2">
                  <button onClick={() => setEditing(p)} className="btn-outline flex-1 !py-1.5 text-xs">✏️ Edit</button>
                  <button onClick={() => setDeleting(p)} className="btn-outline flex-1 !py-1.5 text-xs !text-danger">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <RequestsPanel openId={openId} />
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} className="!max-w-2xl">
          <AddPropertyForm onAdded={() => { setShowAdd(false); flash("✅ Listing published!"); }} />
        </Modal>
      )}
      {showUpgrade && (
        <Modal onClose={() => setShowUpgrade(false)}>
          <h3 className="text-lg font-bold">Upgrade to add more listings</h3>
          <p className="mt-2 text-sm text-slate-600">
            The Basic plan is limited to {BASIC_LISTING_CAP} active listings. Upgrade to
            Premium for <strong>unlimited listings</strong>, priority placement, and more.
          </p>
          <div className="mt-5 flex gap-2">
            <button onClick={() => router.push("/subscription")} className="btn-primary flex-1">
              See Premium
            </button>
            <button onClick={() => setShowUpgrade(false)} className="btn-outline flex-1">
              Not now
            </button>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} className="!max-w-2xl">
          <AddPropertyForm initial={editing} onAdded={() => { setEditing(null); flash("✅ Listing updated!"); }} />
        </Modal>
      )}
      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <h3 className="text-lg font-bold">Delete listing?</h3>
          <p className="mt-2 text-sm text-slate-600">“{deleting.title}” will be permanently removed. This can&apos;t be undone.</p>
          <div className="mt-5 flex gap-2">
            <button onClick={confirmDelete} className="btn-danger flex-1">Delete</button>
            <button onClick={() => setDeleting(null)} className="btn-outline flex-1">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function MyListingsPage() {
  return (
    <Suspense fallback={null}>
      <HubInner />
    </Suspense>
  );
}
