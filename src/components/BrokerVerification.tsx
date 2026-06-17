"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/auth-store";
import { getVerificationRequest, submitVerification } from "@/lib/data/services";
import { fileToDataUrl } from "@/lib/utils";
import type { AiFile, VerificationRequest } from "@/lib/types";

export default function BrokerVerification() {
  const user = useAuthStore((s) => s.user);
  const [req, setReq] = useState<VerificationRequest | null | undefined>(undefined);
  const [company, setCompany] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState<AiFile[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) getVerificationRequest(user.id).then((r) => setReq(r ?? null));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const added = await Promise.all(
      files.map(async (f) => ({ filename: f.name, url: await fileToDataUrl(f) }))
    );
    setDocuments((d) => [...d, ...added]);
  };
  const removeDoc = (i: number) => setDocuments((d) => d.filter((_, idx) => idx !== i));

  const canSubmit = company.trim().length > 0 && documents.length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    const r = await submitVerification(user.id, {
      company: company.trim(),
      licenseNo: licenseNo.trim(),
      message: message.trim(),
      documents,
    });
    setReq(r);
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">Broker verification</h2>
      <p className="mt-1 text-sm text-slate-500">
        A verified badge builds buyer trust and appears on your profile and every listing.
      </p>

      {user.verified ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 p-4">
          <span className="text-xl text-sky-600">✓</span>
          <div>
            <p className="text-sm font-semibold text-sky-800">Verified broker</p>
            <p className="text-xs text-slate-600">
              {user.company}
              {user.licenseNo ? ` · ${user.licenseNo}` : ""}
            </p>
          </div>
        </div>
      ) : req === undefined ? (
        <p className="mt-3 text-sm text-slate-400">Loading…</p>
      ) : req && req.status === "pending" ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">⏳ Verification pending review</p>
          <p className="mt-0.5 text-xs text-slate-600">
            {req.company}
            {req.licenseNo ? ` · ${req.licenseNo}` : ""}
            {req.documents.length > 0 ? ` · ${req.documents.length} document${req.documents.length > 1 ? "s" : ""}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-500">An admin will review your submission shortly.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {req && req.status === "rejected" && (
            <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
              Your previous submission wasn&apos;t approved. Please re-check your details, re-upload your documents, and resubmit.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Business / company name</label>
              <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Primeland Realty Corp." />
            </div>
            <div>
              <label className="label">License / broker no. <span className="font-normal text-slate-400">(optional)</span></label>
              <input className="input" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="PRC / DTI / SEC no. — helps speed up review" />
            </div>
          </div>

          <div>
            <label className="label">
              Verification documents <span className="text-rose-500">*</span>
            </label>
            <p className="mb-1.5 text-xs text-slate-500">
              Upload at least one document — e.g. a valid ID, PRC/DTI license, or proof of ownership. PDF or image.
            </p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-3 py-4 text-sm text-slate-500 hover:border-primary hover:text-primary">
              <span>📎 Choose file(s) to upload</span>
              <input type="file" multiple accept="image/*,.pdf,application/pdf" className="hidden" onChange={onFiles} />
            </label>
            {documents.length > 0 && (
              <ul className="mt-2 space-y-1">
                {documents.map((d, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                    <span className="truncate">📄 {d.filename}</span>
                    <button onClick={() => removeDoc(i)} className="ml-2 shrink-0 text-xs text-rose-500 hover:underline" type="button">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="label">Note to reviewer (optional)</label>
            <textarea className="input min-h-[64px]" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <Button onClick={submit} disabled={!canSubmit}>{busy ? "Submitting…" : "Submit for verification"}</Button>
          {documents.length === 0 && (
            <p className="text-xs text-slate-400">At least one document is required to submit.</p>
          )}
        </div>
      )}
    </section>
  );
}
