"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useViewingsStore } from "@/lib/store/viewings-store";
import { displayName } from "@/lib/utils";
import type { Property } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");
function defaultSlot(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RequestViewingButton({ property }: { property: Property }) {
  const user = useAuthStore((s) => s.user);
  const request = useViewingsStore((s) => s.request);
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(defaultSlot());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) return null;

  const submit = async () => {
    if (!when) return;
    setBusy(true);
    await request({
      propertyId: property.id,
      propertyTitle: property.title,
      requesterId: user.id,
      requesterName: user.username,
      requesterEmail: user.email,
      ownerId: property.ownerId,
      ownerEmail: property.ownerEmail,
      preferredAt: new Date(when).toISOString(),
      message: message.trim(),
    });
    setBusy(false);
    setDone(true);
  };

  return (
    <>
      <button onClick={() => { setDone(false); setOpen(true); }} className="btn-outline mt-2 w-full">
        📅 Request a viewing
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} className="w-full max-w-md">
          <div className="p-6">
            {done ? (
              <div className="text-center">
                <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl">✓</div>
                <h2 className="text-lg font-bold text-ink">Viewing requested</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {displayName(property.ownerEmail)} will confirm or propose a new time. Track it under{" "}
                  <strong>Viewings</strong>.
                </p>
                <Button className="mt-4" onClick={() => setOpen(false)}>Done</Button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-ink">Request a viewing</h2>
                <p className="mt-0.5 text-xs text-slate-500">{property.title}</p>
                <label className="label mt-3">Preferred date &amp; time</label>
                <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
                <label className="label mt-3">Message (optional)</label>
                <textarea
                  className="input min-h-[72px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Anything the owner should know?"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send request"}</Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
