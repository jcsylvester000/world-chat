import Link from "next/link";
import type { Metadata } from "next";
import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_ANNUAL,
  ANNUAL_DISCOUNT_PCT,
  BASIC_LISTING_CAP,
} from "@/lib/constants";
import { formatPeso } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing — WorldChat" };

const TIERS = [
  {
    name: "Basic",
    price: "Free",
    suffix: "",
    note: "No credit card needed",
    blurb: "Get started and build your network.",
    featured: false,
    perks: [
      `Up to ${BASIC_LISTING_CAP} listings`,
      "World & group chat",
      "Direct messages",
      "Browse the map",
      "Ticket-based support",
    ],
  },
  {
    name: "Premium",
    price: formatPeso(PREMIUM_PRICE_MONTHLY),
    suffix: "/month",
    note: `or ${formatPeso(PREMIUM_PRICE_ANNUAL)}/year — save ${ANNUAL_DISCOUNT_PCT}%`,
    blurb: "For active sellers and brokers.",
    featured: true,
    perks: [
      "Unlimited listings",
      "Priority placement & featured on map",
      "Lead capture (ATS & LOI)",
      "AI Property Teaser",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium text-primary">Pricing</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">Simple, honest pricing</h1>
        <p className="mt-4 text-lg text-slate-600">Start free. Upgrade when you&apos;re ready to grow.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {TIERS.map((t) => (
          <div key={t.name} className={`rounded-2xl border bg-white p-8 shadow-sm ${t.featured ? "border-primary ring-2 ring-primary/30" : "border-line"}`}>
            {t.featured && <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">Most popular</span>}
            <h3 className="mt-3 text-xl font-bold text-ink">{t.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{t.blurb}</p>
            <p className="mt-4 text-4xl font-extrabold text-ink">{t.price}<span className="text-base font-medium text-slate-400">{t.suffix ?? ""}</span></p>
            <p className="mt-1 text-xs font-medium text-slate-400">{t.note}</p>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              {t.perks.map((p) => (<li key={p}>✓ {p}</li>))}
            </ul>
            <Link href="/register" className={`mt-8 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold ${t.featured ? "bg-primary text-white hover:bg-primary-dark" : "border border-line text-ink hover:bg-slate-50"}`}>
              {t.featured ? "Start Premium" : "Get started free"}
            </Link>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-line bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-semibold text-ink">How billing works</p>
        <p className="mt-2">
          Billing runs on a calendar month and payment is due on the last day of the month, with a
          5-day grace period before an unpaid Premium account is downgraded to Basic. Upgrades from
          Free to Premium are billed on the next cycle, so you&apos;re never charged twice in one
          month. Free listings expire after 6 months (or 2 months of inactivity); Premium listings
          don&apos;t expire. Full details in our <Link href="/terms" className="text-primary hover:underline">Terms &amp; Billing</Link>.
        </p>
      </div>
      <p className="mt-8 text-center text-sm text-slate-400">Already a member? Manage your plan in <Link href="/subscription" className="text-primary hover:underline">Subscription</Link>.</p>
    </div>
  );
}
