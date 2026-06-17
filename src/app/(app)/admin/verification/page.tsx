"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/store/auth-store";
import { listVerificationRequests, reviewVerification } from "@/lib/data/services";
import { cn, formatDate } from "@/lib/utils";
import type { VerificationRequest, VerificationStatus } from "@/lib/types";

const TONE: Record<VerificationStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function AdminVerificationPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<VerificationRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => listVerificationRequests().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const review = async (id: string, approve: boolean) => {
    if (!user) return;
    setBusy(id);
    await reviewVerification(id, approve, user.email);
    await load();
    setBusy(null);
  };

  const pending = items?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <AuthGate requireAdmin>
      <div className="mx-auto max-w-3xl p-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-ink">Broker verification</h1>
          <p className="text-sm text-slate-500">
            Review submissions and grant the verified badge. {pending > 0 ? `${pending} pending.` : ""}
          </p>
        </header>

        {!items ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon="✓" title="No submissions" description="Broker verification requests will appear here." />
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {r.userName} <span className="text-xs font-normal text-slate-400">{r.userEmail}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">{r.company} · {r.licenseNo}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", TONE[r.status])}>
                    {r.status}
                  </span>
                </div>
                {r.message && <p className="mt-2 text-sm text-slate-600">“{r.message}”</p>}
                <p className="mt-1 text-xs text-slate-400">
                  Submitted {formatDate(r.createdAt)}
                  {r.reviewedBy ? ` · reviewed by ${r.reviewedBy}` : ""}
                </p>
                {r.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => review(r.id, true)} disabled={busy === r.id}>Approve &amp; verify</Button>
                    <Button size="sm" variant="outline" onClick={() => review(r.id, false)} disabled={busy === r.id}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGate>
  );
}
