"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAiStore } from "@/lib/store/ai-store";
import { AI_TOOLS } from "@/lib/constants";
import { cn, formatPeso, formatDate, fileToDataUrl } from "@/lib/utils";
import type { AiFile, AiRequest, AiRequestStatus, AiToolType } from "@/lib/types";


function statusBadge(s: AiRequestStatus) {
  if (s === "completed") return <Badge tone="green">completed</Badge>;
  if (s === "rejected") return <Badge tone="red">rejected</Badge>;
  return <Badge tone="amber">pending</Badge>;
}
function toolName(t: AiToolType) {
  return t === "comparison" ? "Property Comparison" : "Property Analysis";
}

export default function AIToolsPage() {
  const user = useAuthStore((s) => s.user);
  const { requests, loading, fetchMine, submit } = useAiStore();

  const [ready, setReady] = useState(false);
  const [type, setType] = useState<AiToolType>("analysis");
  const [docs, setDocs] = useState<AiFile[]>([]);
  const [description, setDescription] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [open, setOpen] = useState<AiRequest | null>(null);

  const tool = AI_TOOLS.find((t) => t.type === type)!;

  const load = useCallback(() => {
    if (user) fetchMine(user.id).then(() => setReady(true));
  }, [user, fetchMine]);
  useEffect(load, [load]);

  // keep an open request modal in sync with the latest store data
  useEffect(() => {
    if (open) {
      const fresh = requests.find((r) => r.id === open.id);
      if (fresh && fresh !== open) setOpen(fresh);
    }
  }, [requests, open]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3200);
  };

  const onPickType = (t: AiToolType) => {
    setType(t);
    setDocs([]); // doc limits differ per tool
  };
  const onDocs = async (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).slice(0, tool.maxDocs);
    try {
      const read = await Promise.all(
        picked.map(async (f) => ({ filename: f.name, url: await fileToDataUrl(f) }))
      );
      setDocs(read);
    } catch {
      flash("⚠️ Couldn't read one of those files. Please try another.");
    }
  };
  const onProof = async (file: File | null) => {
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      setProofName(file.name);
      setProofUrl(url);
    } catch {
      flash("⚠️ Couldn't read that file. Please try another image.");
    }
  };

  const canSubmit =
    docs.length >= tool.minDocs &&
    docs.length <= tool.maxDocs &&
    description.trim().length > 0 &&
    !!proofUrl;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;
    setSubmitting(true);
    try {
      await submit({
        userId: user.id,
        userEmail: user.email,
        type,
        price: tool.price,
        description: description.trim(),
        documents: docs,
        proofUrl,
      });
      setDocs([]);
      setDescription("");
      setProofUrl(null);
      setProofName("");
      flash("✅ Request submitted! An admin will process it and deliver your documents.");
    } catch {
      flash("⚠️ Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Tools</h1>
        <p className="text-sm text-slate-500">
          On-demand AI help with your property documents. Pay per request — an admin processes it and
          delivers the results to you.
        </p>
      </div>

      {toast && <div className="rounded-lg bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>}

      {/* Tool selector */}
      <div className="grid gap-4 sm:grid-cols-2">
        {AI_TOOLS.map((t) => (
          <button
            key={t.type}
            onClick={() => onPickType(t.type)}
            className={cn(
              "card p-5 text-left transition",
              type === t.type ? "border-primary ring-2 ring-primary/30" : "hover:border-slate-300"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{t.name}</h3>
              <span className="text-lg font-extrabold text-primary">{formatPeso(t.price)}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{t.blurb}</p>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {t.minDocs === t.maxDocs ? `${t.minDocs} document` : `${t.minDocs}–${t.maxDocs} documents`} · per request
            </p>
          </button>
        ))}
      </div>

      {/* Request form */}
      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{tool.name}</h2>
          <span className="text-sm font-semibold text-ink">{formatPeso(tool.price)} / request</span>
        </div>

        <div>
          <label className="label">
            Property document{tool.maxDocs > 1 ? "s" : ""}{" "}
            <span className="text-slate-400">
              ({tool.minDocs === tool.maxDocs ? `exactly ${tool.minDocs}` : `${tool.minDocs}–${tool.maxDocs}`})
            </span>
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            multiple={tool.maxDocs > 1}
            onChange={(e) => onDocs(e.target.files)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
          {docs.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {docs.map((d, i) => (
                <li key={`${d.filename}-${i}`}>📄 {d.filename}</li>
              ))}
            </ul>
          )}
          {docs.length > 0 && docs.length < tool.minDocs && (
            <p className="mt-1 text-xs text-danger">Please upload at least {tool.minDocs} documents.</p>
          )}
        </div>

        <div>
          <label className="label">{tool.descLabel}</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={tool.descPlaceholder}
            className="input"
          />
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <label className="label">Proof of payment <span className="text-slate-400">(required)</span></label>
          <p className="mb-2 text-xs text-slate-500">
            Pay <strong>{formatPeso(tool.price)}</strong> via your usual channel and upload the receipt
            screenshot. The request is sent to an admin once proof is attached.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onProof(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
          {proofName && <p className="mt-1 text-xs text-accent">✓ {proofName} attached</p>}
        </div>

        <button type="submit" disabled={!canSubmit || submitting} className="btn-primary w-full">
          {submitting ? "Submitting…" : `Submit request · ${formatPeso(tool.price)}`}
        </button>
      </form>

      {/* History */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Your requests</h2>
        {!ready || loading ? (
          <Spinner />
        ) : requests.length === 0 ? (
          <p className="rounded-xl border border-line bg-white p-6 text-center text-sm text-slate-400">
            No AI requests yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id}>
                <button onClick={() => setOpen(r)} className="w-full rounded-xl border border-line bg-white p-4 text-left transition hover:border-slate-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{toolName(r.type)}</span>
                    {statusBadge(r.status)}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">{r.description}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {r.number} · {formatPeso(r.price)} · {formatDate(r.createdAt)}
                    {r.status === "completed" ? ` · ${r.resultDocuments.length} document(s) ready` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <Modal onClose={() => setOpen(null)} className="!max-w-lg">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">{toolName(open.type)}</h3>
            {statusBadge(open.status)}
          </div>
          <p className="text-xs text-slate-500">{open.number} · {formatPeso(open.price)} · {formatDate(open.createdAt)}</p>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-semibold text-slate-500">Your request</p>
              <p className="mt-0.5 text-ink">{open.description}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Documents you sent</p>
              <ul className="mt-0.5 space-y-1">
                {open.documents.map((d, i) => (
                  <li key={`${d.filename}-${i}`}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">📄 {d.filename}</a>
                  </li>
                ))}
              </ul>
            </div>
            {open.status === "rejected" && open.adminNotes && (
              <div className="rounded-lg bg-red-50 p-3 text-red-700">
                <p className="font-semibold">Rejected</p>
                <p className="mt-0.5">{open.adminNotes}</p>
              </div>
            )}
            {open.status === "completed" && (
              <div className="rounded-lg bg-primary-50 p-3">
                <p className="font-semibold text-primary">✅ Results ready</p>
                {open.adminNotes && <p className="mt-1 text-slate-600">{open.adminNotes}</p>}
                <ul className="mt-2 space-y-1">
                  {open.resultDocuments.map((d, i) => (
                    <li key={`${d.filename}-${i}`}>
                      <a href={d.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">⬇ {d.filename}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {open.status === "pending" && (
              <p className="text-slate-500">⏳ Your request is being processed. You&apos;ll be notified when it&apos;s ready.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
