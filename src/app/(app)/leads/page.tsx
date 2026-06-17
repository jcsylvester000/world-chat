"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import LeadBoard from "@/components/leads/LeadBoard";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLeadsStore } from "@/lib/store/leads-store";
import { usePropertyStore } from "@/lib/store/property-store";
import { formatPesoCompact } from "@/lib/utils";

export default function LeadsPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const fetchLeads = useLeadsStore((s) => s.fetch);
  const leads = useLeadsStore((s) => s.leads);
  const loaded = useLeadsStore((s) => s.loaded);
  const meta = useLeadsStore((s) => s.meta);
  const myProperties = usePropertyStore((s) => s.myProperties);
  const fetchMine = usePropertyStore((s) => s.fetchMine);

  const isPremium = !!user && (user.plan === "premium" || user.isAdmin);

  useEffect(() => {
    if (user && isPremium) {
      fetchLeads(user.id);
      fetchMine(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isPremium]);

  const summary = useMemo(() => {
    const open = leads.filter((l) => l.status === "open");
    const openValue = open.reduce((s, l) => s + l.value, 0);
    const won = leads.filter((l) => l.status === "won");
    return { openCount: open.length, openValue, wonCount: won.length };
  }, [leads]);

  // Auth/active is handled by the layout's AuthGate. Wait for hydration here.
  if (!hasHydrated || !user) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>;
  }

  // Premium-only feature wall.
  if (!isPremium) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl border border-primary bg-primary-50 p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-2xl text-white">⭐</div>
          <h1 className="text-xl font-bold text-ink">Leads Board is a Premium feature</h1>
          <p className="mt-2 text-sm text-slate-600">
            Track every buyer and tenant through a visual sales pipeline — drag deals from New to
            Won, link them to your listings, and never let a hot lead go stale. Upgrade to unlock the
            Leads Board, unlimited listings, priority placement, and priority support.
          </p>
          <Link href="/subscription" className="btn-primary mt-5 inline-block">Upgrade to Premium</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Leads Board</h1>
          <p className="text-xs text-slate-400">Your sales pipeline — drag deals between stages.</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="font-semibold text-ink">{formatPesoCompact(summary.openValue)}</p>
            <p className="text-[11px] text-slate-400">Open pipeline</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-ink">{summary.openCount}</p>
            <p className="text-[11px] text-slate-400">Open leads</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-emerald-600">{summary.wonCount}</p>
            <p className="text-[11px] text-slate-400">Won</p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 pt-3">
        {!loaded || !meta ? (
          <div className="flex h-full items-center justify-center"><Spinner /></div>
        ) : (
          <LeadBoard properties={myProperties} />
        )}
      </div>
    </div>
  );
}
