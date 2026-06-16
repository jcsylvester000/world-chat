"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  getSetting,
  submitPayment,
  listInvoicesForUser,
  listPaymentsForUser,
  getClock,
} from "@/lib/data/services";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import BillingNotice from "@/components/BillingNotice";
import Modal from "@/components/Modal";
import Badge from "@/components/ui/Badge";
import { cn, formatPeso, formatDate, fileToDataUrl } from "@/lib/utils";
import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_ANNUAL,
  ANNUAL_SAVINGS,
  ANNUAL_DISCOUNT_PCT,
  BASIC_LISTING_CAP,
  planPrice,
} from "@/lib/constants";
import { periodEnd, nextPeriodEnd, billingState, periodLabel } from "@/lib/billing";
import type { BillingInterval, Invoice, Payment } from "@/lib/types";

const BASIC_PERKS = [
  `List up to ${BASIC_LISTING_CAP} properties`,
  "World, group & direct chat",
  "Browse the map & request docs",
  "Ticket-based support (simple issues)",
];
const PREMIUM_PERKS = [
  "Unlimited listings",
  "Priority placement & featured on map",
  "Lead capture (ATS & LOI)",
  "AI Property Teaser",
  "Priority support",
];

function payStatusBadge(s: Payment["status"]) {
  if (s === "approved") return <Badge tone="green">approved</Badge>;
  if (s === "rejected") return <Badge tone="red">rejected</Badge>;
  return <Badge tone="amber">pending review</Badge>;
}

export default function SubscriptionPage() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const isPremium = user?.plan === "premium";

  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<Payment[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [proof, setProof] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [inv, pays, clock] = await Promise.all([
      listInvoicesForUser(user.id),
      listPaymentsForUser(user.id),
      getClock(),
    ]);
    setInvoices(inv);
    setHistory(pays);
    setNow(clock ? new Date(clock) : new Date());
    await refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    getSetting("payment_qr_url").then((v) => v && setQrUrl(v));
    load();
  }, [load]);

  const price = planPrice("premium", interval);
  const state = isPremium ? billingState(user?.planRenewsAt ?? null, now) : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await submitPayment({
        userId: user.id,
        plan: "premium",
        interval,
        reference,
        attachmentUrl: receipt,
      });
      setSuccess(true);
      setReference("");
      load();
    } catch {
      setError("Couldn't submit your payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Your plan & billing</h1>
        <p className="text-sm text-slate-500">
          {isPremium
            ? "Manage your subscription, payments, and invoices."
            : "Upgrade to Premium for unlimited listings and priority placement."}
        </p>
      </div>

      <BillingNotice />

      {/* Current plan + billing status */}
      <div
        className={cn(
          "rounded-2xl border p-4",
          isPremium ? "border-primary bg-primary-50" : "border-line bg-white"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-slate-500">Current plan</p>
            <p className="text-lg font-bold capitalize text-ink">
              {user?.plan ?? "basic"}
              {isPremium && user?.planInterval ? ` · ${user.planInterval}` : ""}
              {state === "grace" && <Badge tone="amber" className="ml-2">in grace</Badge>}
              {state === "overdue" && <Badge tone="red" className="ml-2">overdue</Badge>}
            </p>
          </div>
          {isPremium && user?.planRenewsAt ? (
            <p className="text-sm text-slate-600">
              Payment due <span className="font-medium">{formatDate(user.planRenewsAt)}</span>
            </p>
          ) : (
            <p className="max-w-xs text-right text-sm text-slate-600">
              Upgrade now and your first bill is due{" "}
              <span className="font-medium">{formatDate(nextPeriodEnd(now).toISOString())}</span> (next cycle).
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Billing period {periodLabel(now)} · due {formatDate(periodEnd(now).toISOString())}
        </p>
      </div>

      {/* Plan comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-lg font-bold">Basic</h3>
          <p className="text-sm text-slate-500">For getting started</p>
          <p className="mt-3 text-3xl font-extrabold text-ink">Free</p>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
            {BASIC_PERKS.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>
          {!isPremium && (
            <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Your current plan
            </span>
          )}
        </div>

        <div className="card border-primary p-5 ring-2 ring-primary/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Premium</h3>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
              Most popular
            </span>
          </div>
          <p className="text-sm text-slate-500">For active sellers & brokers</p>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {formatPeso(price)}
            <span className="text-base font-medium text-slate-400">
              {interval === "annual" ? " /year" : " /month"}
            </span>
          </p>
          {interval === "annual" ? (
            <p className="mt-1 text-xs font-medium text-accent">
              ≈ {formatPeso(Math.round(PREMIUM_PRICE_ANNUAL / 12))}/mo · save{" "}
              {ANNUAL_DISCOUNT_PCT}% ({formatPeso(ANNUAL_SAVINGS)})
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              or {formatPeso(PREMIUM_PRICE_ANNUAL)}/year — save {ANNUAL_DISCOUNT_PCT}%
            </p>
          )}
          <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
            {PREMIUM_PERKS.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Checkout */}
      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <h2 className="text-lg font-bold">
          {isPremium ? "Renew or change billing term" : "Upgrade to Premium"}
        </h2>

        <div>
          <label className="label">Billing interval</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["monthly", "annual"] as const).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInterval(i)}
                className={cn(
                  "rounded-lg border p-3 text-left transition",
                  interval === i ? "border-primary bg-primary-50" : "border-line hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize text-ink">{i}</span>
                  {i === "annual" && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                      SAVE {ANNUAL_DISCOUNT_PCT}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {i === "monthly"
                    ? `${formatPeso(PREMIUM_PRICE_MONTHLY)} / month`
                    : `${formatPeso(PREMIUM_PRICE_ANNUAL)} / year`}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">Total due now</span>
          <span className="text-xl font-bold text-ink">
            {formatPeso(price)}
            <span className="text-sm font-medium text-slate-400">
              {interval === "annual" ? " /year" : " /month"}
            </span>
          </span>
        </div>

        {qrUrl && (
          <div>
            <label className="label">Scan to pay</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Payment QR" className="h-44 w-44 rounded-xl border border-line" />
          </div>
        )}

        <div>
          <label className="label">Reference number</label>
          <input
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. GCASH-123456"
            className="input"
          />
        </div>

        <div>
          <label className="label">Upload proof of payment</label>
          <input
            type="file"
            required
            accept="image/*"
            onChange={async (e) => { const fl = e.target.files?.[0]; if (!fl) { setReceipt(null); return; } try { setReceipt(await fileToDataUrl(fl)); } catch { setError("Couldn\u2019t read that file. Please try another image."); } }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
          <p className="mt-1 text-xs text-slate-400">
            An admin verifies your payment, then your plan is activated and an invoice is issued.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Submitting…" : `Submit payment · ${formatPeso(price)}`}
        </button>

        {success && (
          <p className="text-center text-sm text-accent">
            ✓ Payment submitted! An admin will review it shortly.
          </p>
        )}
        {error && <p className="text-center text-sm text-danger">{error}</p>}
      </form>

      {/* Invoices */}
      <div className="card p-6">
        <h2 className="text-lg font-bold">Invoices</h2>
        <p className="text-sm text-slate-500">Download a PDF invoice for any approved payment.</p>
        {invoices.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No invoices yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{inv.number}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)} · {inv.interval}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-ink">{formatPeso(inv.amount)}</span>
                  <Badge tone={inv.status === "paid" ? "green" : "neutral"}>{inv.status}</Badge>
                  <button onClick={() => downloadInvoicePdf(inv)} className="btn-outline !px-3 !py-1.5 text-xs">
                    ⬇ PDF
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Payment history with proof */}
      <div className="card p-6">
        <h2 className="text-lg font-bold">Payment history</h2>
        <p className="text-sm text-slate-500">Your submitted payments and their proof of payment.</p>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No payments submitted yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {history.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  {p.attachmentUrl ? (
                    <button onClick={() => setProof(p.attachmentUrl!)} className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.attachmentUrl} alt="Proof" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </button>
                  ) : (
                    <div className="grid h-12 w-10 shrink-0 place-items-center rounded-lg border border-dashed border-line text-[10px] text-slate-400">none</div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-ink">{p.plan} · {p.interval} · {formatPeso(p.plan === "premium" ? planPrice("premium", p.interval) : 0)}</p>
                    <p className="text-xs text-slate-400">ref {p.reference} · {formatDate(p.createdAt)}</p>
                  </div>
                </div>
                {payStatusBadge(p.status)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {proof && (
        <Modal onClose={() => setProof(null)} className="!max-w-lg">
          <h3 className="mb-3 text-lg font-bold">Proof of payment</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proof} alt="Proof of payment" className="max-h-[70vh] w-full rounded-lg object-contain" />
        </Modal>
      )}
    </div>
  );
}
