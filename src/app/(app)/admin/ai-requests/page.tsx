"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Modal from "@/components/Modal";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAiStore } from "@/lib/store/ai-store";
import { cn, displayName, formatDate, formatTime, formatPeso, fileToDataUrl } from "@/lib/utils";
import type { AiFile, AiRequestStatus } from "@/lib/types";


function statusBadge(s: AiRequestStatus) {
  if (s === "completed") return <Badge tone="green">completed</Badge>;
  if (s === "rejected") return <Badge tone="red">rejected</Badge>;
  return <Badge tone="amber">pending</Badge>;
}
const toolName = (t: string) => (t === "comparison" ? "Property Comparison" : "Property Analysis");

function AiRequestsContent() {
  const admin = useAuthStore((s) => s.user)!;
  const { requests, loading, fetchAll, review } = useAiStore();

  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<"pending" | "completed" | "rejected" | "all">("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  // per-selection work state
  const [resultDocs, setResultDocs] = useState<AiFile[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAll().then(() => setReady(true));
  }, [fetchAll]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  };

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      requests.filter(
        (r) =>
          (filter === "all" || r.status === filter) &&
          (q === "" ||
            r.userEmail.toLowerCase().includes(q) ||
            r.number.toLowerCase().includes(q) ||
            toolName(r.type).toLowerCase().includes(q))
      ),
    [requests, filter, q]
  );

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  // load the selected request's existing notes/result docs into the work panel
  useEffect(() => {
    if (selected) {
      setResultDocs(selected.resultDocuments);
      setNotes(selected.adminNotes ?? "");
    }
  }, [selectedId, selected?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const onResultDocs = async (files: FileList | null) => {
    if (!files) return;
    try {
      const read = await Promise.all(
        Array.from(files).map(async (f) => ({ filename: f.name, url: await fileToDataUrl(f) }))
      );
      setResultDocs(read);
    } catch {
      flash("⚠️ Couldn't read one of those files. Please try another.");
    }
  };

  const runReview = async (status: AiRequestStatus, msg: string, extra: { resultDocuments?: AiFile[] } = {}) => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await review(admin, selected.id, status, { notes, ...extra });
      flash(msg);
    } catch {
      flash("⚠️ Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const complete = () =>
    selected && resultDocs.length > 0 &&
    runReview("completed", `✅ ${selected.number} marked completed — ${displayName(selected.userEmail)} notified.`, { resultDocuments: resultDocs });
  const reject = () =>
    selected && notes.trim() &&
    runReview("rejected", `${selected.number} rejected — ${displayName(selected.userEmail)} notified.`);
  const setPending = () =>
    selected && runReview("pending", `${selected.number} set back to pending.`);

  return (
    <div className="w-full space-y-5 px-4 py-4 sm:px-6">
      <div>
        <Link href="/admin" className="text-xs text-primary hover:underline">← Admin console</Link>
        <h1 className="text-2xl font-bold">AI requests</h1>
        <p className="text-sm text-slate-500">
          Process paid AI Tool requests: review documents and proof of payment, deliver results, and mark status.
        </p>
      </div>

      {toast && <div className="rounded-lg bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-line bg-white p-1 text-sm">
          {(["pending", "completed", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-3 py-1.5 font-medium capitalize transition", filter === f ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100")}>
              {f}
            </button>
          ))}
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search by user, number or type…" className="input max-w-xs" />
      </div>

      {!ready || loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(280px,360px)_1fr]">
          {/* Request list */}
          <ul className={cn("space-y-2", selectedId && "hidden lg:block")}>
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "w-full rounded-xl border bg-white p-3 text-left transition",
                    selectedId === r.id ? "border-primary ring-2 ring-primary/30" : "border-line hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{toolName(r.type)}</span>
                    {statusBadge(r.status)}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.number} · {displayName(r.userEmail)} · {formatPeso(r.price)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="rounded-xl border border-line bg-white p-6 text-center text-sm text-slate-400">No requests match.</li>
            )}
          </ul>

          {/* Work panel (uses the wide right column) */}
          {!selected ? (
            <div className="hidden place-items-center rounded-2xl border border-dashed border-line bg-white p-10 text-sm text-slate-400 lg:grid">
              Select a request to review and process it.
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <button onClick={() => setSelectedId(null)} className="mb-3 text-sm text-primary hover:underline lg:hidden">← Back to list</button>
              {/* header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <Avatar email={selected.userEmail} size={44} />
                  <div>
                    <p className="font-semibold text-ink">{displayName(selected.userEmail)}</p>
                    <p className="text-xs text-slate-500">{selected.userEmail}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-ink">{toolName(selected.type)} · {formatPeso(selected.price)}</p>
                  <p className="text-xs text-slate-500">
                    {selected.number} · requested {formatDate(selected.createdAt)} {formatTime(selected.createdAt)}
                  </p>
                  <div className="mt-1">{statusBadge(selected.status)}</div>
                </div>
              </div>

              {/* two-column body */}
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                {/* left: what the user sent */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Request</p>
                    <p className="mt-1 text-sm text-ink">{selected.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Uploaded documents ({selected.documents.length})
                    </p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {selected.documents.map((d, i) => (
                        <li key={`${d.filename}-${i}`}>
                          <a href={d.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">⬇ {d.filename}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Proof of payment</p>
                    {selected.proofUrl ? (
                      <button onClick={() => setProof(selected.proofUrl)} className="mt-1 block h-40 w-32 overflow-hidden rounded-lg border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selected.proofUrl} alt="Proof of payment" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">No proof attached.</p>
                    )}
                  </div>
                </div>

                {/* right: admin actions */}
                <div className="space-y-4 rounded-xl bg-slate-50 p-4">
                  <div>
                    <label className="label">Deliver result documents</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      onChange={(e) => onResultDocs(e.target.files)}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-100"
                    />
                    {resultDocs.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-slate-600">
                        {resultDocs.map((d, i) => (
                          <li key={`${d.filename}-${i}`}>📄 {d.filename}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="label">Notes (sent to the user on reject/complete)</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional notes…" className="input" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={complete} disabled={resultDocs.length === 0 || busy} className="btn-accent !py-2 text-sm">
                      ✅ Mark completed
                    </button>
                    <button onClick={reject} disabled={!notes.trim() || busy} className="btn-outline !py-2 text-sm !text-danger disabled:opacity-50">Reject</button>
                    {selected.status !== "pending" && (
                      <button onClick={setPending} disabled={busy} className="btn-ghost !py-2 text-sm">↺ Set pending</button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Mark completed needs ≥1 result document; rejecting needs a note.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {proof && (
        <Modal onClose={() => setProof(null)} className="!max-w-lg">
          <h3 className="mb-3 text-lg font-bold">Proof of payment</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proof} alt="Proof of payment" className="max-h-[70vh] w-full rounded-lg object-contain" />
        </Modal>
      )}
    </div>
  );
}

export default function AdminAiRequestsPage() {
  return (
    <AuthGate requireAdmin>
      <AiRequestsContent />
    </AuthGate>
  );
}
