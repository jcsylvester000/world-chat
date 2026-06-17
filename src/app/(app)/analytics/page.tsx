"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/lib/store/auth-store";
import { getBrokerAnalytics, listRequestsForOwner } from "@/lib/data/services";
import { formatPesoCompact, cn } from "@/lib/utils";
import type { BrokerAnalytics } from "@/lib/types";

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className={cn("text-2xl font-bold", tone ?? "text-ink")}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isPremium = !!user && (user.plan === "premium" || user.isAdmin);

  const [data, setData] = useState<BrokerAnalytics | null>(null);
  const [reqByProp, setReqByProp] = useState<Record<string, number>>({});
  const [reqTotal, setReqTotal] = useState(0);

  useEffect(() => {
    if (user && isPremium) {
      getBrokerAnalytics(user.id).then(setData);
      listRequestsForOwner(user.id).then((rs) => {
        const m: Record<string, number> = {};
        rs.forEach((r) => (m[r.propertyId] = (m[r.propertyId] || 0) + 1));
        setReqByProp(m);
        setReqTotal(rs.length);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isPremium]);

  const totals = useMemo(() => {
    if (!data) return null;
    return {
      listings: data.listings.length,
      value: data.listings.reduce((s, l) => s + l.price, 0),
      views: data.listings.reduce((s, l) => s + l.views, 0),
      saves: data.listings.reduce((s, l) => s + l.saves, 0),
      inquiries: data.listings.reduce((s, l) => s + l.viewings, 0) + reqTotal,
    };
  }, [data, reqTotal]);

  if (!hasHydrated || !user) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>;
  }
  if (!isPremium) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl border border-primary bg-primary-50 p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-2xl text-white">📊</div>
          <h1 className="text-xl font-bold text-ink">Analytics is a Premium feature</h1>
          <p className="mt-2 text-sm text-slate-600">
            See views, saves, and inquiries on every listing, plus your lead pipeline funnel. Upgrade to
            unlock the analytics dashboard.
          </p>
          <Link href="/subscription" className="btn-primary mt-5 inline-block">Upgrade to Premium</Link>
        </div>
      </div>
    );
  }
  if (!data || !totals) {
    return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  }

  const maxFunnel = Math.max(1, ...data.funnel.map((f) => f.count));

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Analytics</h1>
        <p className="text-sm text-slate-500">How your listings and pipeline are performing.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Listings" value={totals.listings} />
        <Stat label="Portfolio value" value={formatPesoCompact(totals.value)} />
        <Stat label="Total views" value={totals.views} tone="text-primary" />
        <Stat label="Saves" value={totals.saves} tone="text-rose-500" />
        <Stat label="Inquiries" value={totals.inquiries} tone="text-accent" />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Listing performance</h2>
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Listing</th>
                <th className="px-3 py-2 text-right font-medium">Views</th>
                <th className="px-3 py-2 text-right font-medium">Saves</th>
                <th className="px-3 py-2 text-right font-medium">Inquiries</th>
              </tr>
            </thead>
            <tbody>
              {data.listings.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No listings yet.</td></tr>
              ) : (
                data.listings.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="max-w-[260px] truncate px-4 py-2">
                      <Link href={`/listings/${l.id}`} className="font-medium text-ink hover:text-primary">{l.title}</Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.views}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.saves}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.viewings + (reqByProp[l.id] ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Pipeline funnel</h2>
        <div className="space-y-2 rounded-xl border border-line bg-white p-4">
          {data.funnel.map((f) => (
            <div key={f.stageId} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-slate-600">{f.stageName}</span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-slate-100">
                <div
                  className={cn(
                    "flex h-full items-center justify-end rounded px-2 text-[11px] font-medium text-white",
                    f.stageName === "Won" ? "bg-emerald-500" : f.stageName === "Lost" ? "bg-rose-400" : "bg-primary"
                  )}
                  style={{ width: `${Math.max(f.count ? 12 : 0, (f.count / maxFunnel) * 100)}%` }}
                >
                  {f.count > 0 && f.count}
                </div>
              </div>
              <span className="w-20 shrink-0 text-right text-xs text-slate-500">{formatPesoCompact(f.value)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
