"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/store/auth-store";
import { useViewingsStore } from "@/lib/store/viewings-store";
import { cn, formatDate, formatTime, displayName } from "@/lib/utils";
import type { Viewing, ViewingStatus } from "@/lib/types";

const STATUS: Record<ViewingStatus, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Declined", cls: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-500" },
};

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const whenOf = (v: Viewing) => {
  const iso = v.status === "confirmed" && v.confirmedAt ? v.confirmedAt : v.preferredAt;
  return `${formatDate(iso)} · ${formatTime(iso)}`;
};

export default function ViewingsPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const received = useViewingsStore((s) => s.received);
  const sent = useViewingsStore((s) => s.sent);
  const loaded = useViewingsStore((s) => s.loaded);
  const fetch = useViewingsStore((s) => s.fetch);
  const respond = useViewingsStore((s) => s.respond);
  const cancel = useViewingsStore((s) => s.cancel);

  const [tab, setTab] = useState<"received" | "sent">("received");
  const [respondTo, setRespondTo] = useState<{ v: Viewing; mode: "confirm" | "decline" } | null>(null);
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) fetch(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!hasHydrated || !user) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>;
  }

  const pendingCount = received.filter((v) => v.status === "requested").length;
  const list = tab === "received" ? received : sent;

  const openRespond = (v: Viewing, mode: "confirm" | "decline") => {
    setSlot(toLocalInput(v.preferredAt));
    setNote("");
    setRespondTo({ v, mode });
  };
  const submitRespond = async () => {
    if (!respondTo) return;
    setBusy(true);
    if (respondTo.mode === "confirm")
      await respond(respondTo.v.id, "confirm", new Date(slot).toISOString(), note.trim() || null);
    else await respond(respondTo.v.id, "decline", null, note.trim() || null);
    setBusy(false);
    setRespondTo(null);
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Viewings</h1>
        <p className="text-sm text-slate-500">Schedule and manage property viewings.</p>
      </header>

      <div className="mb-5 flex gap-1 border-b border-line">
        <button
          onClick={() => setTab("received")}
          className={cn(
            "-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium",
            tab === "received" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink"
          )}
        >
          Received
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab("sent")}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
            tab === "sent" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink"
          )}
        >
          Sent
        </button>
      </div>

      {!loaded ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : list.length === 0 ? (
        <EmptyState
          icon="📅"
          title={tab === "received" ? "No viewing requests" : "No viewings requested"}
          description={
            tab === "received"
              ? "When a buyer requests a viewing of one of your listings, it shows up here."
              : "Open any listing and tap “Request a viewing” to schedule one."
          }
          action={tab === "sent" ? <Link href="/all-listings" className="btn-primary">Browse listings</Link> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {list.map((v) => (
            <div key={v.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/listings/${v.propertyId}`} className="font-semibold text-ink hover:text-primary">
                    {v.propertyTitle}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {tab === "received" ? `From ${v.requesterName}` : `Owner: ${displayName(v.ownerEmail)}`} · 🗓 {whenOf(v)}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[v.status].cls)}>
                  {STATUS[v.status].label}
                </span>
              </div>

              {v.message && <p className="mt-2 text-sm text-slate-600">“{v.message}”</p>}
              {v.ownerNote && (
                <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                  <span className="font-medium">Owner note:</span> {v.ownerNote}
                </p>
              )}

              {tab === "received" && v.status === "requested" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => openRespond(v, "confirm")}>Confirm / reschedule</Button>
                  <Button size="sm" variant="outline" onClick={() => openRespond(v, "decline")}>Decline</Button>
                </div>
              )}
              {tab === "sent" && (v.status === "requested" || v.status === "confirmed") && (
                <div className="mt-3">
                  <button onClick={() => cancel(v.id)} className="text-xs font-medium text-rose-500 hover:underline">
                    Cancel viewing
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {respondTo && (
        <Modal onClose={() => setRespondTo(null)} className="w-full max-w-md">
          <div className="p-6">
            <h2 className="text-lg font-bold text-ink">
              {respondTo.mode === "confirm" ? "Confirm viewing" : "Decline viewing"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{respondTo.v.propertyTitle}</p>
            {respondTo.mode === "confirm" && (
              <>
                <label className="label mt-3">Confirmed date &amp; time</label>
                <input type="datetime-local" className="input" value={slot} onChange={(e) => setSlot(e.target.value)} />
                <p className="mt-1 text-[11px] text-slate-400">Adjust to reschedule, or keep the buyer&apos;s requested time.</p>
              </>
            )}
            <label className="label mt-3">Note to the buyer (optional)</label>
            <textarea className="input min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRespondTo(null)}>Cancel</Button>
              <Button
                variant={respondTo.mode === "decline" ? "danger" : "primary"}
                onClick={submitRespond}
                disabled={busy}
              >
                {busy ? "Saving…" : respondTo.mode === "confirm" ? "Confirm" : "Decline"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
