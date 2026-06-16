"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Modal from "@/components/Modal";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn, displayName, formatDate, formatTime } from "@/lib/utils";
import type { SupportTicket } from "@/lib/types";

const PAGE_SIZE = 50;

function TicketsContent() {
  const admin = useAuthStore((s) => s.user)!;
  const { tickets, loading, fetchAll, reply, setStatus } = useTicketStore();

  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchAll().then(() => setReady(true));
  }, [fetchAll]);
  useEffect(() => {
    if (open) {
      const fresh = tickets.find((t) => t.id === open.id);
      if (fresh && fresh !== open) setOpen(fresh);
    }
  }, [tickets, open]);
  useEffect(() => setPage(1), [filter, query]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  };

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (filter === "all" || t.status === filter) &&
          (q === "" ||
            t.userEmail.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.number.toLowerCase().includes(q))
      ),
    [tickets, filter, q]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safe = Math.min(page, totalPages);
  const items = filtered.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE);
  const openCount = tickets.filter((t) => t.status === "open").length;

  const sendReply = async () => {
    if (!open || !replyText.trim()) return;
    await reply(open.id, admin, replyText.trim());
    setReplyText("");
    flash("Reply sent to user.");
  };
  const toggleStatus = async () => {
    if (!open) return;
    const next = open.status === "open" ? "resolved" : "open";
    await setStatus(admin, open.id, next);
    flash(next === "resolved" ? "Ticket resolved." : "Ticket reopened.");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <div>
        <Link href="/admin" className="text-xs text-primary hover:underline">← Admin console</Link>
        <h1 className="text-2xl font-bold">Support tickets</h1>
        <p className="text-sm text-slate-500">
          Basic-plan users get ticket-only support. {openCount} open ticket{openCount === 1 ? "" : "s"}.
        </p>
      </div>

      {toast && <div className="rounded-lg bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-line bg-white p-1 text-sm">
          {(["open", "resolved", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-3 py-1.5 font-medium capitalize transition", filter === f ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100")}>
              {f}
            </button>
          ))}
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search by user, subject or number…" className="input max-w-xs" />
      </div>

      {!ready || loading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {items.map((t) => (
              <li key={t.id}>
                <button onClick={() => setOpen(t)} className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Avatar email={t.userEmail} size={36} />
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {t.subject}
                        {t.priority && <Badge tone="violet" className="ml-2">priority</Badge>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.number} · {displayName(t.userEmail)} · {t.category} · updated {formatDate(t.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <Badge tone={t.status === "open" ? "amber" : "green"}>{t.status}</Badge>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-6 text-center text-sm text-slate-400">No tickets match.</li>}
          </ul>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safe === 1} className="btn-outline !px-3 !py-1 text-xs">← Prev</button>
              <span className="text-xs text-slate-500">Page {safe} / {totalPages} · {PAGE_SIZE}/page</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={safe === totalPages} className="btn-outline !px-3 !py-1 text-xs">Next →</button>
            </div>
          )}
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(null)} className="!max-w-lg">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">{open.subject}</h3>
            <Badge tone={open.status === "open" ? "amber" : "green"}>{open.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">
            {open.number} · {displayName(open.userEmail)} · {open.category}{open.priority ? " · priority" : ""}
          </p>

          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">{displayName(open.userEmail)} · {formatDate(open.createdAt)} {formatTime(open.createdAt)}</p>
              <p className="mt-1 text-sm text-ink">{open.message}</p>
            </div>
            {open.replies.map((r) => (
              <div key={r.id} className={cn("rounded-lg p-3", r.isAdmin ? "bg-primary-50" : "bg-slate-50")}>
                <p className="text-xs font-semibold text-slate-500">
                  {r.isAdmin ? "You (admin)" : displayName(r.fromEmail)} · {formatDate(r.createdAt)} {formatTime(r.createdAt)}
                </p>
                <p className="mt-1 text-sm text-ink">{r.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} placeholder="Reply to the user…" className="input flex-1" />
            <button onClick={sendReply} disabled={!replyText.trim()} className="btn-primary">Send</button>
          </div>
          <button onClick={toggleStatus} className={cn("mt-2 w-full !py-1.5 text-xs", open.status === "open" ? "btn-accent" : "btn-outline")}>
            {open.status === "open" ? "Mark resolved" : "Reopen ticket"}
          </button>
        </Modal>
      )}
    </div>
  );
}

export default function AdminTicketsPage() {
  return (
    <AuthGate requireAdmin>
      <TicketsContent />
    </AuthGate>
  );
}
