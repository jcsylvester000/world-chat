"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLeadsStore } from "@/lib/store/leads-store";
import type { Lead, LeadMeta, Property } from "@/lib/types";

type Props = {
  lead: Lead | null; // null = create
  meta: LeadMeta;
  properties: Pick<Property, "id" | "title">[];
  onClose: () => void;
};

export default function LeadModal({ lead, meta, properties, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const add = useLeadsStore((s) => s.add);
  const edit = useLeadsStore((s) => s.edit);
  const remove = useLeadsStore((s) => s.remove);

  const isEdit = !!lead;
  const [title, setTitle] = useState(lead?.title ?? "");
  const [contactName, setContactName] = useState(lead?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(lead?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(lead?.contactPhone ?? "");
  const [value, setValue] = useState<string>(lead ? String(lead.value) : "");
  const [propertyId, setPropertyId] = useState(lead?.propertyId ?? "");
  const [sourceId, setSourceId] = useState(lead?.sourceId ?? meta.sources[0]?.id ?? "");
  const [typeId, setTypeId] = useState(lead?.typeId ?? meta.types[0]?.id ?? "");
  const [stageId, setStageId] = useState(lead?.stageId ?? meta.stages[0]?.id ?? "");
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    lead?.expectedCloseDate ? lead.expectedCloseDate.slice(0, 10) : ""
  );
  const [description, setDescription] = useState(lead?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stage = meta.stages.find((s) => s.id === stageId);
  const status = stage?.isWon ? "won" : stage?.isLost ? "lost" : "open";

  const save = async () => {
    if (!user) return;
    if (!title.trim() || !contactName.trim()) {
      setError("A title and contact name are required.");
      return;
    }
    setSaving(true);
    setError("");
    const prop = properties.find((p) => p.id === propertyId);
    const base = {
      ownerId: user.id,
      ownerEmail: user.email,
      title: title.trim(),
      description: description.trim(),
      value: Number(value) || 0,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      propertyId: prop ? prop.id : null,
      propertyTitle: prop ? prop.title : null,
      sourceId,
      typeId,
      stageId,
      status: status as Lead["status"],
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
      closedAt: status !== "open" ? lead?.closedAt ?? new Date().toISOString() : null,
      lostReason: status === "lost" ? lead?.lostReason ?? null : null,
    };
    try {
      if (isEdit && lead) await edit(lead.id, base);
      else await add(base);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const del = async () => {
    if (!lead) return;
    setSaving(true);
    await remove(lead.id);
    onClose();
  };

  return (
    <Modal onClose={onClose} className="w-full max-w-lg">
      <div className="max-h-[85vh] overflow-auto p-6">
        <h2 className="text-lg font-bold text-ink">{isEdit ? "Edit lead" : "New lead"}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Track a buyer or tenant through your pipeline.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Buyer for Makati floor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact name</label>
              <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div>
              <label className="label">Deal value (₱)</label>
              <input className="input" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div>
              <label className="label">Contact email</label>
              <input className="input" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Contact phone</label>
              <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Linked listing (optional)</label>
            <select className="input" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              <option value="">— None —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Stage</label>
              <select className="input" value={stageId} onChange={(e) => setStageId(e.target.value)}>
                {meta.stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <select className="input" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                {meta.sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                {meta.types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Expected close date</label>
            <input className="input" type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[72px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {isEdit ? (
            <Button variant="danger" size="sm" onClick={del} disabled={saving}>Delete</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save" : "Add lead"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
