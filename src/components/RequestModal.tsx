"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequestsStore } from "@/lib/store/requests-store";
import type { Property, RequestKind } from "@/lib/types";

// Simple lead-capture request. For an ATS that requires an LOI, the
// buyer must ATTACH a Letter of Intent (a file — never typed text),
// because serious owners only act on a real document.
export default function RequestModal({
  property,
  kind,
  requiresLOI,
  onClose,
  onDone,
}: {
  property: Property;
  kind: RequestKind;
  requiresLOI: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const create = useRequestsStore((s) => s.create);

  const [name, setName] = useState(user?.username ?? "");
  const [note, setNote] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const needsLoi = kind === "ats" && requiresLOI;

  const submit = async () => {
    if (needsLoi && !loi) return;
    setBusy(true);
    try {
      await create({
        property,
        requester: user,
        kind,
        requesterName: name.trim() || user.username,
        message: note.trim(),
        loiFilename: loi ?? undefined,
      });
      onDone();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold">
        {kind === "ats" ? "Request the ATS" : "Request documents"}
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        For <span className="font-medium text-ink">{property.title}</span>.
      </p>

      <div className="space-y-4">
        <div>
          <label className="label">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Your ID</label>
          <input value={user.code} readOnly className="input bg-slate-50 font-mono" />
        </div>

        {needsLoi && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-800">
              📝 Attach your Letter of Intent (required)
            </p>
            <p className="mb-2 text-xs text-amber-700">
              The owner only releases the ATS to buyers who provide an LOI document.
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setLoi(e.target.files?.[0]?.name ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            {loi && <p className="mt-1 text-xs text-slate-600">📎 {loi}</p>}
          </div>
        )}

        <div>
          <label className="label">Message (optional)</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a short note…"
            className="input"
          />
        </div>

        <button
          onClick={submit}
          disabled={busy || (needsLoi && !loi)}
          className="btn-primary w-full"
        >
          {busy ? "Sending…" : needsLoi ? "Send LOI & request ATS" : "Send request"}
        </button>
      </div>
    </Modal>
  );
}
