"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/auth-store";
import { getVerificationRequest, submitVerification } from "@/lib/data/services";
import type { VerificationRequest } from "@/lib/types";

export default function BrokerVerification() {
  const user = useAuthStore((s) => s.user);
  const [req, setReq] = useState<VerificationRequest | null | undefined>(undefined);
  const [company, setCompany] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) getVerificationRequest(user.id).then((r) => setReq(r ?? null));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const submit = async () => {
    if (!company.trim() || !licenseNo.trim()) return;
    setBusy(true);
    const r = await submitVerification(user.id, {
      company: company.trim(),
      licenseNo: licenseNo.trim(),
      message: message.trim(),
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
          <p className="mt-0.5 text-xs text-slate-600">{req.company} · {req.licenseNo}</p>
          <p className="mt-1 text-xs text-slate-500">An admin will review your submission shortly.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {req && req.status === "rejected" && (
            <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
              Your previous submission wasn&apos;t approved. Please double-check your details and resubmit.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Business / company name</label>
              <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Primeland Realty Corp." />
            </div>
            <div>
              <label className="label">License / registration no.</label>
              <input className="input" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="PRC / DTI / SEC no." />
            </div>
          </div>
          <div>
            <label className="label">Note to reviewer (optional)</label>
            <textarea className="input min-h-[64px]" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit for verification"}</Button>
        </div>
      )}
    </section>
  );
}
