"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  listLeadActivities,
  addLeadActivity,
  setLeadActivityDone,
  deleteLeadActivity,
} from "@/lib/data/services";
import { formatDate, formatTime, cn } from "@/lib/utils";
import type { LeadActivity, LeadActivityType } from "@/lib/types";

const TYPES: { value: LeadActivityType; label: string; icon: string }[] = [
  { value: "note", label: "Note", icon: "📝" },
  { value: "call", label: "Call", icon: "📞" },
  { value: "email", label: "Email", icon: "✉️" },
  { value: "meeting", label: "Meeting", icon: "🤝" },
  { value: "task", label: "Follow-up task", icon: "⏰" },
];
const iconOf = (t: LeadActivityType) => TYPES.find((x) => x.value === t)?.icon ?? "•";

export default function LeadActivities({ leadId, onChanged }: { leadId: string; onChanged?: () => void }) {
  const [items, setItems] = useState<LeadActivity[] | null>(null);
  const [type, setType] = useState<LeadActivityType>("note");
  const [note, setNote] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => listLeadActivities(leadId).then(setItems);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const add = async () => {
    if (!note.trim()) return;
    setBusy(true);
    await addLeadActivity({
      leadId,
      type,
      note: note.trim(),
      dueAt: type === "task" && due ? new Date(due).toISOString() : null,
    });
    setNote("");
    setDue("");
    setType("note");
    await load();
    onChanged?.();
    setBusy(false);
  };
  const toggle = async (a: LeadActivity) => {
    await setLeadActivityDone(a.id, !a.done);
    await load();
    onChanged?.();
  };
  const del = async (a: LeadActivity) => {
    await deleteLeadActivity(a.id);
    await load();
    onChanged?.();
  };

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-sm font-semibold text-ink">Activity &amp; follow-ups</p>

      <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
        <div className="flex gap-2">
          <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value as LeadActivityType)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
          {type === "task" && (
            <input type="datetime-local" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
          )}
        </div>
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={type === "task" ? "What needs doing?" : "Log a note…"}
        />
        <Button size="sm" onClick={add} disabled={busy}>{busy ? "Adding…" : "Add"}</Button>
      </div>

      <div className="mt-3 space-y-2">
        {!items ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-400">No activity yet — log a call, note, or follow-up.</p>
        ) : (
          items.map((a) => {
            const overdue = a.type === "task" && !a.done && a.dueAt && new Date(a.dueAt) < new Date();
            return (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <span aria-hidden>{iconOf(a.type)}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-slate-700", a.done && "text-slate-400 line-through")}>{a.note}</p>
                  <p className="text-[11px] text-slate-400">
                    {a.dueAt ? (
                      <span className={cn(overdue && "font-medium text-rose-500")}>
                        Due {formatDate(a.dueAt)} {formatTime(a.dueAt)}{overdue ? " · overdue" : ""}
                      </span>
                    ) : (
                      `Logged ${formatDate(a.createdAt)}`
                    )}
                  </p>
                </div>
                {a.type === "task" && (
                  <button onClick={() => toggle(a)} className="shrink-0 text-[11px] font-medium text-primary hover:underline">
                    {a.done ? "Reopen" : "Done"}
                  </button>
                )}
                <button onClick={() => del(a)} className="shrink-0 text-[11px] text-slate-400 hover:text-rose-500" aria-label="Delete">
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
