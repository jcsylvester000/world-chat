import type { Metadata } from "next";
import Link from "next/link";
import {
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_ANNUAL,
  ANNUAL_DISCOUNT_PCT,
  BASIC_LISTING_CAP,
} from "@/lib/constants";
import {
  GRACE_DAYS,
  FREE_LISTING_MAX_AGE_MONTHS,
  INACTIVITY_EXPIRY_MONTHS,
} from "@/lib/billing";
import { formatPeso } from "@/lib/utils";

export const metadata: Metadata = { title: "Terms & Billing — WorldChat" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-600">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="text-sm font-medium text-primary">Terms & Billing</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">Terms, Conditions & Billing Policy</h1>
        <p className="mt-4 text-lg text-slate-600">
          The rules that govern accounts, subscriptions, billing, and listings on WorldChat.
        </p>
      </div>

      <Section title="1. Accounts & plans">
        <p>
          Every account starts on the free <strong>Basic</strong> plan. Basic members may keep up to{" "}
          <strong>{BASIC_LISTING_CAP} active listings</strong>, use chat and messaging, browse the map,
          and build their network. <strong>Premium</strong> removes the listing limit and adds priority
          placement, lead capture, and AI on request.
        </p>
        <p>
          Premium is <strong>{formatPeso(PREMIUM_PRICE_MONTHLY)} / month</strong>, or{" "}
          <strong>{formatPeso(PREMIUM_PRICE_ANNUAL)} / year</strong> when billed annually
          (12 months less {ANNUAL_DISCOUNT_PCT}%).
        </p>
      </Section>

      <Section title="2. Billing cycle & due dates">
        <p>
          Billing follows the calendar month. A billing period runs from the{" "}
          <strong>1st day of the month to the last day of the month</strong>, and payment is{" "}
          <strong>always due on the last day of the month</strong>. This aligns with the common
          15th/30th payroll cycle: subscribed members are expected to settle by month-end.
        </p>
        <p>
          Payments are processed <strong>manually</strong>. You pay via the provided QR, upload your
          proof of payment, and an administrator verifies it. Once verified, your plan is activated or
          changed and a <strong>downloadable invoice</strong> is issued to you automatically.
        </p>
      </Section>

      <Section title="3. Grace period & downgrades">
        <p>
          If payment is not received by the due date, a <strong>{GRACE_DAYS}-day grace period</strong>{" "}
          applies. If the account is still unpaid after the grace period, it is automatically{" "}
          <strong>downgraded to Basic</strong>.
        </p>
        <p>
          On downgrade, any listings beyond the {BASIC_LISTING_CAP}-listing Basic limit are{" "}
          <strong>permanently removed</strong> from the marketplace (the most recent {BASIC_LISTING_CAP}{" "}
          are kept). We recommend settling before month-end to avoid interruption.
        </p>
      </Section>

      <Section title="4. Upgrading from Free to Premium">
        <p>
          When you upgrade from Basic to Premium, you are <strong>billed on the next cycle</strong> — you
          are never charged twice within the same month. Your first invoice is issued at the end of the
          following billing period, which is the fair and standard approach.
        </p>
      </Section>

      <Section title="5. Listing expiry">
        <p>
          Free (Basic) listings are not permanent. A free listing <strong>expires {FREE_LISTING_MAX_AGE_MONTHS} months</strong>{" "}
          after it is posted, or after <strong>{INACTIVITY_EXPIRY_MONTHS} months of account inactivity</strong> —
          whichever comes first — and is then removed from the marketplace. Staying active on the platform
          keeps your listings live. <strong>Premium listings do not expire</strong> while the subscription
          is active.
        </p>
      </Section>

      <Section title="6. Invoices & records">
        <p>
          Every approved payment produces an invoice that both you and the administrator can view and
          download as a PDF. Invoices record the billing period, amount, payment reference, and proof of
          payment on file. You can access your invoices any time from the{" "}
          <Link href="/subscription" className="text-primary hover:underline">Subscription</Link> page.
        </p>
      </Section>

      <Section title="7. Support">
        <p>
          <strong>Basic</strong> members receive <strong>ticket-based support</strong> for simple
          issues — submit a ticket from the Support page and our team will respond. Direct, priority
          admin support is a <strong>Premium</strong> benefit: Premium tickets are prioritized and an
          admin can reach you directly. For serious or time-sensitive support, upgrade to Premium.
        </p>
      </Section>

      <Section title="8. Changes">
        <p>
          Pricing and policies may change with notice. Continued use of WorldChat after a change takes
          effect constitutes acceptance of the updated terms.
        </p>
      </Section>

      <p className="mt-10 text-center text-sm text-slate-400">
        Questions about billing? See the{" "}
        <Link href="/faq" className="text-primary hover:underline">FAQ</Link> or{" "}
        <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>.
      </p>
    </div>
  );
}
