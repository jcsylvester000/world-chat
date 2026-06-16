// ─── Billing period & expiry math ───────────────────────────────
// Pure, date-only helpers shared by the services layer and the UI.
//
// Rules:
//  • A billing period runs from the 1st of the month to the last day.
//  • Payment is always DUE on the last day of the month.
//  • There is a 5-day grace window after the due date; if a premium
//    account is still unpaid after grace, it is downgraded to Basic.
//  • Free (Basic) listings expire 6 months after they are posted, or
//    after 2 months of account inactivity — whichever comes first.
//  • Upgrades from Free → Premium are billed on the NEXT cycle.

export const GRACE_DAYS = 5;
export const FREE_LISTING_MAX_AGE_MONTHS = 6;
export const INACTIVITY_EXPIRY_MONTHS = 2;

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// First day of the month at 00:00.
export function periodStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
// Last day of the month at 23:59:59 — this is also the DUE date.
export function periodEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
export function dueDate(d: Date): Date {
  return periodEnd(d);
}
// Next cycle (used for Free → Premium upgrades, which bill next month).
export function nextPeriodStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}
export function nextPeriodEnd(d: Date): Date {
  return periodEnd(nextPeriodStart(d));
}
// End of the grace window after a due date.
export function graceEnd(due: Date): Date {
  return addDays(due, GRACE_DAYS);
}

export type BillingState = "active" | "due" | "grace" | "overdue";

// Where a premium account sits relative to its due date + grace window.
export function billingState(renewsAt: string | null, now: Date): BillingState {
  if (!renewsAt) return "active";
  const due = new Date(renewsAt);
  if (now <= due) return "active";
  if (now <= graceEnd(due)) return "grace";
  return "overdue";
}

// When a free listing expires: min(posted + 6mo, lastActive + 2mo).
export function freeListingExpiry(createdAt: string, lastActiveAt: string): Date {
  const byAge = addMonths(new Date(createdAt), FREE_LISTING_MAX_AGE_MONTHS);
  const byInactivity = addMonths(new Date(lastActiveAt), INACTIVITY_EXPIRY_MONTHS);
  return byAge < byInactivity ? byAge : byInactivity;
}
export function isFreeListingExpired(
  createdAt: string,
  lastActiveAt: string,
  now: Date
): boolean {
  return now >= freeListingExpiry(createdAt, lastActiveAt);
}

// e.g. "June 2026"
export function periodLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
