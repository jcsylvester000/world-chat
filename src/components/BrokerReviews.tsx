"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/auth-store";
import { getBrokerReviews, submitReview } from "@/lib/data/services";
import { formatDate, displayName } from "@/lib/utils";
import type { BrokerReviewsBundle, Property } from "@/lib/types";

const STAR = "M12 2l3 6.3 6.9 1-5 4.8 1.2 6.9L12 17.8 5.9 21l1.2-6.9-5-4.8 6.9-1z";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size} fill={i <= Math.round(value) ? "#f59e0b" : "#e2e8f0"}>
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5" aria-label={`${i} star`}>
          <svg viewBox="0 0 24 24" width={22} height={22} fill={i <= value ? "#f59e0b" : "#e2e8f0"}>
            <path d={STAR} />
          </svg>
        </button>
      ))}
    </span>
  );
}

export default function BrokerReviews({ property }: { property: Property }) {
  const user = useAuthStore((s) => s.user);
  const [bundle, setBundle] = useState<BrokerReviewsBundle | null>(null);
  const [open, setOpen] = useState(false);
  const [comm, setComm] = useState(5);
  const [know, setKnow] = useState(5);
  const [hon, setHon] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => getBrokerReviews(property.ownerId, user?.id).then(setBundle);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.ownerId, user?.id]);

  useEffect(() => {
    if (bundle?.myReview) {
      setComm(bundle.myReview.communication);
      setKnow(bundle.myReview.knowledge);
      setHon(bundle.myReview.honesty);
      setComment(bundle.myReview.comment);
    }
  }, [bundle?.myReview]);

  if (!bundle) return null;
  const brokerName = displayName(property.ownerEmail);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    await submitReview({
      brokerId: property.ownerId,
      brokerEmail: property.ownerEmail,
      reviewerId: user.id,
      reviewerName: user.username,
      reviewerEmail: user.email,
      communication: comm,
      knowledge: know,
      honesty: hon,
      comment: comment.trim(),
    });
    await load();
    setBusy(false);
  };

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button onClick={() => setOpen(true)} className="flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-1.5">
          <Stars value={bundle.average} />
          <span className="text-sm font-semibold text-ink">{bundle.count ? bundle.average.toFixed(1) : "New"}</span>
          <span className="text-xs text-slate-400">
            ({bundle.count} review{bundle.count !== 1 ? "s" : ""})
          </span>
        </span>
        <span className="text-xs font-medium text-primary">See all →</span>
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)} className="w-full max-w-lg">
          <div className="max-h-[85vh] overflow-auto p-6">
            <h2 className="text-lg font-bold text-ink">Reviews for {brokerName}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Stars value={bundle.average} size={16} />
              <span className="text-sm font-semibold text-ink">{bundle.count ? bundle.average.toFixed(1) : "—"}</span>
              <span className="text-xs text-slate-400">· {bundle.count} review{bundle.count !== 1 ? "s" : ""}</span>
            </div>

            {bundle.canReview && (
              <div className="mt-4 rounded-xl border border-line bg-slate-50 p-4">
                <p className="text-sm font-semibold text-ink">{bundle.myReview ? "Edit your review" : "Write a review"}</p>
                <div className="mt-2 space-y-1.5">
                  {([["Communication", comm, setComm], ["Market knowledge", know, setKnow], ["Honesty", hon, setHon]] as const).map(
                    ([label, val, set]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">{label}</span>
                        <StarInput value={val} onChange={set} />
                      </div>
                    )
                  )}
                </div>
                <textarea
                  className="input mt-2 min-h-[64px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this broker…"
                />
                <Button size="sm" className="mt-2" onClick={submit} disabled={busy}>
                  {busy ? "Saving…" : bundle.myReview ? "Update review" : "Submit review"}
                </Button>
              </div>
            )}
            {!bundle.canReview && !bundle.myReview && user && user.id !== property.ownerId && (
              <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                Reviews can be left after a confirmed viewing with this broker.
              </p>
            )}

            <div className="mt-4 space-y-3">
              {bundle.reviews.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No reviews yet.</p>
              ) : (
                bundle.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">{r.reviewerName}</span>
                      <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Stars value={r.overall} />
                      <span className="text-xs text-slate-500">{r.overall.toFixed(1)}</span>
                    </div>
                    {r.comment && <p className="mt-1.5 text-sm text-slate-600">{r.comment}</p>}
                    <p className="mt-1 text-[11px] text-slate-400">
                      Communication {r.communication} · Knowledge {r.knowledge} · Honesty {r.honesty}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
