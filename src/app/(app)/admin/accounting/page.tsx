"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Modal from "@/components/Modal";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAdminStore } from "@/lib/store/admin-store";
import { useBillingStore } from "@/lib/store/billing-store";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { planPrice } from "@/lib/constants";
import { billingState, periodStart, periodEnd, periodLabel } from "@/lib/billing";
import { cn, displayName, formatDate, formatPeso } from "@/lib/utils";
import type { BillingRunResult } from "@/lib/data/services";
import type { Payment, Profile } from "@/lib/types";

const PAGE_SIZE = 50;
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function stateBadge(state: string) {
  if (state === "overdue") return <Badge tone="red">overdue</Badge>;
  if (state === "grace") return <Badge tone="amber">grace</Badge>;
  if (state === "due") return <Badge tone="blue">due</Badge>;
  return <Badge tone="green">active</Badge>;
}
function payStatusBadge(s: Payment["status"]) {
  if (s === "approved") return <Badge tone="green">approved</Badge>;
  if (s === "rejected") return <Badge tone="red">rejected</Badge>;
  return <Badge tone="amber">pending</Badge>;
}

function AccountingContent() {
  const admin = useAuthStore((s) => s.user)!;
  const { users, fetchAll: fetchUsers } = useAdminStore();
  const { invoices, payments, clock, loading, fetchAll, setClock, runCycle, approve, reject, sendReminder } =
    useBillingStore();

  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"outstanding" | "payments" | "invoices" | "accounts">("outstanding");
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [proof, setProof] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [runResult, setRunResult] = useState<BillingRunResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reminderDate, setReminderDate] = useState("");

  useEffect(() => {
    Promise.all([fetchAll(), fetchUsers()]).then(() => setReady(true));
  }, [fetchAll, fetchUsers]);

  const now = useMemo(() => (clock ? new Date(clock) : new Date()), [clock]);

  useEffect(() => {
    if (!reminderDate) setReminderDate(toDateInput(periodEnd(now)));
  }, [now, reminderDate]);
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [tab, query]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  };
  const userOf = (id: string) => users.find((u) => u.id === id);
  const q = query.trim().toLowerCase();

  // Outstanding = premium accounts that owe for the current period.
  const outstanding = useMemo(() => {
    const ps = periodStart(now);
    const pe = periodEnd(now);
    const paidThisPeriod = (uid: string) =>
      payments.some(
        (p) =>
          p.userId === uid &&
          p.status === "approved" &&
          p.periodEnd &&
          new Date(p.periodEnd) >= ps &&
          new Date(p.periodEnd) <= pe
      );
    return users
      .filter((u) => u.plan === "premium")
      .map((u) => {
        const raw = billingState(u.planRenewsAt, now);
        const due = u.planRenewsAt ? new Date(u.planRenewsAt) : null;
        const dueThisPeriod = !!due && due >= ps && due <= pe;
        const owes = raw === "grace" || raw === "overdue" || (dueThisPeriod && !paidThisPeriod(u.id));
        const state = raw === "active" && owes ? "due" : raw;
        return { u, state, due, amount: planPrice("premium", u.planInterval ?? "monthly"), owes };
      })
      .filter((x) => x.owes && (q === "" || x.u.email.toLowerCase().includes(q)));
  }, [users, payments, now, q]);

  const outstandingTotal = outstanding.reduce((s, x) => s + x.amount, 0);

  const stats = useMemo(() => {
    const ps = periodStart(now).getTime();
    const pe = periodEnd(now).getTime();
    const collectedThisMonth = invoices
      .filter((i) => {
        const t = new Date(i.issuedAt).getTime();
        return t >= ps && t <= pe;
      })
      .reduce((s, i) => s + i.amount, 0);
    const collectedAllTime = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const pending = payments.filter((p) => p.status === "pending").length;
    return { collectedThisMonth, collectedAllTime, pending };
  }, [invoices, payments, now]);

  // Filtered lists per tab
  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        const u = userOf(p.userId);
        return (
          q === "" ||
          (u?.email.toLowerCase().includes(q) ?? false) ||
          p.reference.toLowerCase().includes(q)
        );
      }),
    [payments, q, users] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (i) => q === "" || i.number.toLowerCase().includes(q) || i.userEmail.toLowerCase().includes(q)
      ),
    [invoices, q]
  );
  const filteredAccounts = useMemo(
    () =>
      [...users]
        .filter((u) => q === "" || u.email.toLowerCase().includes(q))
        .sort((a, b) => Number(b.plan === "premium") - Number(a.plan === "premium")),
    [users, q]
  );

  const paginate = <T,>(list: T[]) => {
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const safe = Math.min(page, totalPages);
    return { items: list.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE), totalPages, safe };
  };

  const onApprove = async (p: Payment) => {
    await approve(admin, p.id, p.userId, "premium");
    flash(`✅ Approved — invoice issued to ${displayName(userOf(p.userId)?.email ?? p.userId)}.`);
  };
  const onReject = async (p: Payment) => {
    await reject(admin, p.id);
    flash("Payment rejected.");
  };
  const applyDate = async () => {
    if (!dateInput) return;
    await setClock(new Date(`${dateInput}T12:00:00`).toISOString());
    flash(`Demo clock set to ${dateInput}.`);
  };
  const resetClock = async () => {
    await setClock(null);
    setDateInput("");
    flash("Demo clock reset to live time.");
  };
  const onRunCycle = async () => setRunResult(await runCycle(admin));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = outstanding.length > 0 && outstanding.every((x) => selected.has(x.u.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(outstanding.map((x) => x.u.id)));
  const onSendReminders = async () => {
    if (selected.size === 0) return flash("Select at least one account.");
    const count = await sendReminder(admin, [...selected], new Date(`${reminderDate}T12:00:00`).toISOString());
    setSelected(new Set());
    flash(`📨 Reminder sent to ${count} account(s) — due ${reminderDate}.`);
  };

  const Stat = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <p className={cn("text-xl font-bold", tone ?? "text-ink")}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );

  const Pager = ({ totalPages, safe }: { totalPages: number; safe: number }) =>
    totalPages > 1 ? (
      <div className="flex items-center justify-between border-t border-line px-4 py-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safe === 1} className="btn-outline !px-3 !py-1 text-xs">← Prev</button>
        <span className="text-xs text-slate-500">Page {safe} / {totalPages} · {PAGE_SIZE}/page</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={safe === totalPages} className="btn-outline !px-3 !py-1 text-xs">Next →</button>
      </div>
    ) : null;

  const amountOf = (p: Payment) => (p.plan === "premium" ? planPrice("premium", p.interval) : 0);

  const paidPayments = paginate(filteredPayments);
  const paidInvoices = paginate(filteredInvoices);
  const paidAccounts = paginate(filteredAccounts);
  const paidOutstanding = paginate(outstanding);

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <div>
        <Link href="/admin" className="text-xs text-primary hover:underline">← Admin console</Link>
        <h1 className="text-2xl font-bold">Accounting</h1>
        <p className="text-sm text-slate-500">Track manual payments, outstanding balances, invoices, and month-end billing.</p>
      </div>

      {toast && <div className="rounded-lg bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>}

      {/* Billing controls */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Billing clock</p>
            <p className="text-lg font-bold text-ink">{formatDate(now.toISOString())}</p>
            <p className="text-xs text-slate-500">
              {clock ? "Demo date (simulated)" : "Live time"} · period {periodLabel(now)} · due {formatDate(periodEnd(now).toISOString())}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="input !w-auto !py-1.5 text-sm" />
            <button onClick={applyDate} className="btn-outline !py-1.5 text-xs">Set date</button>
            <button onClick={resetClock} className="btn-ghost !py-1.5 text-xs">Reset to live</button>
            <button onClick={onRunCycle} className="btn-primary !py-1.5 text-xs">Run month-end billing</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={`Collected · ${periodLabel(now)}`} value={formatPeso(stats.collectedThisMonth)} tone="text-accent" />
        <Stat label="Collected · all time" value={formatPeso(stats.collectedAllTime)} tone="text-primary" />
        <Stat label="Outstanding" value={formatPeso(outstandingTotal)} tone="text-danger" />
        <Stat label="Pending payments" value={String(stats.pending)} tone="text-amber-600" />
      </div>

      <div className="flex flex-wrap gap-1 border-b border-line">
        {([
          ["outstanding", `Outstanding (${outstanding.length})`],
          ["payments", `Payments (${payments.length})`],
          ["invoices", `Invoices (${invoices.length})`],
          ["accounts", "Accounts"],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-medium transition", tab === t ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink")}>
            {label}
          </button>
        ))}
      </div>

      {/* Dynamic search */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          tab === "invoices" ? "🔍 Search invoices by number or user…"
          : tab === "payments" ? "🔍 Search payments by user or reference…"
          : "🔍 Search by user email…"
        }
        className="input max-w-md"
      />

      {!ready || loading ? (
        <Spinner />
      ) : tab === "outstanding" ? (
        <div className="space-y-3">
          {/* Reminder controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4" />
              Select all ({outstanding.length})
            </label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-amber-800">Payment due by</span>
              <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="input !w-auto !py-1.5 text-sm" />
              <button onClick={onSendReminders} disabled={selected.size === 0} className="btn-primary !py-1.5 text-xs">
                📨 Send reminder ({selected.size})
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <ul className="divide-y divide-line">
              {paidOutstanding.items.map(({ u, state, amount }) => (
                <li key={u.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} className="h-4 w-4" />
                    <Avatar email={u.email} size={36} />
                    <div>
                      <p className="text-sm font-semibold text-ink">{displayName(u.email)}</p>
                      <p className="text-xs text-slate-500">
                        {u.planInterval} · due {u.planRenewsAt ? formatDate(u.planRenewsAt) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-ink">{formatPeso(amount)}</span>
                    {stateBadge(state)}
                  </div>
                </li>
              ))}
              {outstanding.length === 0 && (
                <li className="p-6 text-center text-sm text-slate-400">🎉 No outstanding balances.</li>
              )}
            </ul>
            <Pager totalPages={paidOutstanding.totalPages} safe={paidOutstanding.safe} />
          </div>
        </div>
      ) : tab === "payments" ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {paidPayments.items.map((p) => {
              const u = userOf(p.userId);
              return (
                <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {p.attachmentUrl ? (
                      <button onClick={() => setProof(p.attachmentUrl!)} className="h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.attachmentUrl} alt="Proof" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="grid h-14 w-12 shrink-0 place-items-center rounded-lg border border-dashed border-line text-[10px] text-slate-400">none</div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-ink">{u ? displayName(u.email) : p.userId}</p>
                      <p className="text-xs text-slate-500">{p.plan} · {p.interval} · {formatPeso(amountOf(p))} · ref {p.reference}</p>
                      <p className="text-xs text-slate-400">
                        {p.periodStart && p.periodEnd ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)} · ` : ""}
                        submitted {formatDate(p.createdAt)}{p.reviewedBy ? ` · by ${displayName(p.reviewedBy)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {payStatusBadge(p.status)}
                    {p.status === "pending" && (
                      <>
                        <button onClick={() => onApprove(p)} className="btn-accent !px-3 !py-1.5 text-xs">Approve</button>
                        <button onClick={() => onReject(p)} className="btn-outline !px-3 !py-1.5 text-xs !text-danger">Reject</button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {filteredPayments.length === 0 && <li className="p-6 text-center text-sm text-slate-400">No payments match.</li>}
          </ul>
          <Pager totalPages={paidPayments.totalPages} safe={paidPayments.safe} />
        </div>
      ) : tab === "invoices" ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {paidInvoices.items.map((inv) => (
              <li key={inv.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{inv.number} · <span className="font-normal text-slate-500">{displayName(inv.userEmail)}</span></p>
                  <p className="text-xs text-slate-400">{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)} · {inv.plan} ({inv.interval}) · issued {formatDate(inv.issuedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-ink">{formatPeso(inv.amount)}</span>
                  <Badge tone={inv.status === "paid" ? "green" : "neutral"}>{inv.status}</Badge>
                  <button onClick={() => downloadInvoicePdf(inv)} className="btn-outline !px-3 !py-1.5 text-xs">⬇ PDF</button>
                </div>
              </li>
            ))}
            {filteredInvoices.length === 0 && <li className="p-6 text-center text-sm text-slate-400">No invoices match.</li>}
          </ul>
          <Pager totalPages={paidInvoices.totalPages} safe={paidInvoices.safe} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {paidAccounts.items.map((u: Profile) => {
              const state = u.plan === "premium" ? billingState(u.planRenewsAt, now) : null;
              return (
                <li key={u.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar email={u.email} size={36} />
                    <div>
                      <p className="text-sm font-semibold text-ink">{displayName(u.email)}</p>
                      <p className="text-xs text-slate-500">
                        <span className={cn("font-medium capitalize", u.plan === "premium" ? "text-primary" : "text-slate-500")}>{u.plan}</span>
                        {u.plan === "premium" && u.planInterval ? ` · ${u.planInterval}` : ""}
                        {u.plan === "premium" && u.planRenewsAt ? ` · due ${formatDate(u.planRenewsAt)}` : ""}
                      </p>
                    </div>
                  </div>
                  {state && stateBadge(state)}
                </li>
              );
            })}
            {filteredAccounts.length === 0 && <li className="p-6 text-center text-sm text-slate-400">No accounts match.</li>}
          </ul>
          <Pager totalPages={paidAccounts.totalPages} safe={paidAccounts.safe} />
        </div>
      )}

      {proof && (
        <Modal onClose={() => setProof(null)} className="!max-w-lg">
          <h3 className="mb-3 text-lg font-bold">Proof of payment</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proof} alt="Proof of payment" className="max-h-[70vh] w-full rounded-lg object-contain" />
        </Modal>
      )}

      {runResult && (
        <Modal onClose={() => setRunResult(null)}>
          <h3 className="text-lg font-bold">Month-end billing run</h3>
          <p className="mt-1 text-sm text-slate-500">As of {formatDate(runResult.date)}.</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Accounts downgraded (unpaid)</span><span className="font-bold text-danger">{runResult.downgraded}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Grace-period reminders sent</span><span className="font-bold text-amber-600">{runResult.warned}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Expired listings removed</span><span className="font-bold text-ink">{runResult.expiredListings}</span></div>
          </div>
          <button onClick={() => setRunResult(null)} className="btn-primary mt-5 w-full">Done</button>
        </Modal>
      )}
    </div>
  );
}

export default function AccountingPage() {
  return (
    <AuthGate requireAdmin>
      <AccountingContent />
    </AuthGate>
  );
}
