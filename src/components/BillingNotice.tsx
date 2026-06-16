"use client";

import { useState } from "react";
import { GRACE_DAYS, FREE_LISTING_MAX_AGE_MONTHS, INACTIVITY_EXPIRY_MONTHS } from "@/lib/billing";

// End-of-month billing explainer shown to every user. `dismissible` lets it be
// closed on pages where it's secondary (e.g. the dashboard).
export default function BillingNotice({ dismissible = false }: { dismissible?: boolean }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="relative rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      {dismissible && (
        <button
          onClick={() => setHidden(true)}
          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-blue-400 hover:bg-blue-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
      <p className="font-semibold">📅 How billing works</p>
      <p className="mt-1 text-blue-800">
        Billing runs on a calendar month (1st → last day) and{" "}
        <strong>payment is always due on the last day of the month</strong>. There&apos;s a{" "}
        {GRACE_DAYS}-day grace period — if payment isn&apos;t received by then, the account is
        downgraded to Basic. New <strong>Free → Premium upgrades are billed on the next cycle</strong>,
        so you&apos;re never charged twice in one month. Free listings expire after{" "}
        {FREE_LISTING_MAX_AGE_MONTHS} months (or {INACTIVITY_EXPIRY_MONTHS} months of inactivity);
        Premium listings don&apos;t expire.
      </p>
    </div>
  );
}
