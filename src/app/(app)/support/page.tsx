"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn, formatDate, formatTime, displayName } from "@/lib/utils";
import type { SupportTicket, TicketCategory } from "@/lib/types";

const CATEGORIES: TicketCategory[] = ["Login", "Listing", "Payment", "Account", "Bug", "Other"];
const BASIC_MAX = 300;

export default function SupportPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === "premium";
  const { tickets, loading, fetchMine, create, reply } = useTicketStore();

  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState<TicketCategory>("Login");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [open, setOpen] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");

  const maxLen = isPremium ? 1500 : BASIC_MAX;

  const load = useCallback(() => {
    if (user) fetchMine(user.id).then(() => setReady(true));
  }, [user, fetchMine]);
  useEffect(load, [load]);

  // keep the open ticket in sync with the latest store data
  useEffect(() => {
    if (open) {
      const fresh = tickets.find((t) => t.id === open.id);
      if (fresh && fresh !== open) setOpen(fresh);
    }
  }, [tickets, open]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2800);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;
    try {
      await create({
        userId: user.id,
        userEmail: user.email,
        plan: user.plan,
        priority: isPremium,
        category,
        subject: subject.trim(),
        message: message.trim().slice(0, maxLen),
      });
      setSubject("");
      setMessage("");
      setCategory("Login");
      flash("✅ Ticket submitted. Our team will get back to you.");
    } catch {
      flash("⚠️ Couldn't submit your ticket. Please try again.");
    }
  };

  const sendReply = async () => {
    if (!user || !open || !replyText.trim()) return;
    try {
      await reply(open.id, user, replyText.trim());
      setReplyText("");
      flash("Reply sent.");
    } catch {
      flash("⚠️ Couldn't send your reply. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-sm text-slate-500">
          {isPremium
            ? "You're on Premium — your tickets are prioritized for faster admin response."
            : "Submit a ticket for simple issues and our team will help."}
        </p>
      </div>

      {toast && <div className="rounded-lg bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>}

      {/* Tier banner */}
      {isPremium ? (
        <div className="rounded-xl border border-primary bg-primary-50 px-4 py-3 text-sm text-primary">
          ⭐ <strong>Priority support.</strong> As a Premium member your tickets jump the queue and an
          admin can reach you directly.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm">
          <span className="text-slate-600">
            Basic support is <strong>ticket-only</strong>, for simple issues. Want priority, direct admin
            help? <strong>Upgrade to Premium.</strong>
          </span>
          <button onClick={() => router.push("/subscription")} className="btn-primary !py-1.5 text-xs">
            Upgrade
          </button>
        </div>
      )}

      {/* New ticket */}
      <form onSubmit={submit} className="card space-y-4 p-6">
        <h2 className="text-lg font-bold">{isPremium ? "Open a priority ticket" : "Open a ticket"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={80} placeholder="Short summary" className="input" />
          </div>
        </div>
        <div>
          <label className="label">Describe the issue</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLen))}
            rows={4}
            placeholder={isPremium ? "Tell us what's going on…" : "Keep it simple — one issue per ticket."}
            className="input"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{message.length}/{maxLen}</p>
        </div>
        <button type="submit" disabled={!subject.trim() || !message.trim()} className="btn-primary w-full">
          Submit ticket
        </button>
      </form>

      {/* My tickets */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Your tickets</h2>
        {!ready || loading ? (
          <Spinner />
        ) : tickets.length === 0 ? (
          <p className="rounded-xl border border-line bg-white p-6 text-center text-sm text-slate-400">No tickets yet.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <button onClick={() => setOpen(t)} className="w-full rounded-xl border border-line bg-white p-4 text-left transition hover:border-slate-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{t.subject}</span>
                    <Badge tone={t.status === "open" ? "amber" : "green"}>{t.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.number} · {t.category}{t.priority ? " · priority" : ""} · updated {formatDate(t.updatedAt)}
                    {t.replies.length > 0 ? ` · ${t.replies.length} repl${t.replies.length === 1 ? "y" : "ies"}` : ""}
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
            <h3 className="text-lg font-bold">{open.subject}</h3>
            <Badge tone={open.status === "open" ? "amber" : "green"}>{open.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">{open.number} · {open.category}{open.priority ? " · priority" : ""}</p>

          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">You · {formatDate(open.createdAt)} {formatTime(open.createdAt)}</p>
              <p className="mt-1 text-sm text-ink">{open.message}</p>
            </div>
            {open.replies.map((r) => (
              <div key={r.id} className={cn("rounded-lg p-3", r.isAdmin ? "bg-primary-50" : "bg-slate-50")}>
                <p className="text-xs font-semibold text-slate-500">
                  {r.isAdmin ? "Support" : displayName(r.fromEmail)} · {formatDate(r.createdAt)} {formatTime(r.createdAt)}
                </p>
                <p className="mt-1 text-sm text-ink">{r.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendReply()}
              placeholder="Add a reply…"
              className="input flex-1"
            />
            <button onClick={sendReply} disabled={!replyText.trim()} className="btn-primary">Send</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
