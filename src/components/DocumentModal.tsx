"use client";

import { useRef } from "react";
import Modal from "@/components/Modal";

// Displays a MOCK Authority-to-Sell / Letter-of-Intent document (real
// uploads would render the actual file). Optionally exposes a
// "Provide …" action so the viewer can attach the counterpart document
// right from the viewer — e.g. an owner reads the LOI then provides the
// ATS. These are always attachments, never typed text.
export default function DocumentModal({
  kind,
  fromName,
  filename,
  onClose,
  onProvide,
  provideLabel,
}: {
  kind: "ats" | "loi";
  fromName: string;
  filename?: string;
  onClose: () => void;
  onProvide?: (filename: string) => void;
  provideLabel?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const isAts = kind === "ats";
  const title = isAts ? "Authority to Sell" : "Letter of Intent";

  return (
    <Modal onClose={onClose} className="!max-w-2xl">
      <div className="mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        {filename && <p className="text-xs text-slate-500">📎 {filename}</p>}
      </div>

      {/* Mock document "paper" with a letterhead theme */}
      <div className="rounded-xl border border-line bg-white p-6 shadow-inner">
        <div className="border-b-2 border-primary pb-3">
          <p className="text-lg font-bold tracking-tight text-primary">{fromName}</p>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            {isAts ? "Licensed Real Estate Brokerage" : "Prospective Buyer"}
          </p>
        </div>

        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-700">
          {title}
        </p>

        {isAts ? (
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
            <p>To whom it may concern,</p>
            <p>
              This document certifies that <strong>{fromName}</strong> holds the
              valid and exclusive <strong>Authority to Sell</strong> the subject
              property, duly authorized by the registered owner.
            </p>
            <p>
              This authority is presented in good faith to qualified buyers who
              have expressed serious intent. All particulars are available for
              verification upon engagement.
            </p>
            <p className="pt-4">Respectfully,</p>
            <p className="font-semibold italic">{fromName}</p>
          </div>
        ) : (
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
            <p>Dear Owner / Authorized Broker,</p>
            <p>
              We, <strong>{fromName}</strong>, formally express our serious
              intent to proceed with the acquisition of the subject property,
              subject to review of the Authority to Sell and supporting
              documents.
            </p>
            <p>
              We are ready, willing, and able to transact, and submit this
              Letter of Intent in good faith to move discussions forward.
            </p>
            <p className="pt-4">Sincerely,</p>
            <p className="font-semibold italic">{fromName}</p>
          </div>
        )}
      </div>

      {onProvide && (
        <div className="mt-5">
          <button onClick={() => fileRef.current?.click()} className="btn-accent w-full">
            {provideLabel ?? "Provide document"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                onProvide(f.name);
                onClose();
              }
            }}
          />
          <p className="mt-1 text-center text-xs text-slate-400">
            Attach a file — these documents must be uploaded, not typed.
          </p>
        </div>
      )}
    </Modal>
  );
}
