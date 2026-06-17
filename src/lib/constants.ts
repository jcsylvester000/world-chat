import type { PropertyTag, PropertyType, AiToolType } from "./types";

// Human-friendly labels for property tags (keys match the DB values).
export const TAG_NAMES: Record<PropertyTag, string> = {
  AsIs: "As-Is",
  CleanTitle: "Clean Title",
  JoinVentures: "Joint Ventures",
  CompanyOwned: "Company Owned",
  IndividualOwner: "Individual Owner",
  LookingToSell: "Looking to Sell",
  LookingForBuyer: "Looking For Buyer",
};

export const ALL_TAGS: PropertyTag[] = [
  "AsIs",
  "CleanTitle",
  "JoinVentures",
  "CompanyOwned",
  "IndividualOwner",
  "LookingToSell",
  "LookingForBuyer",
];

// Badge tone per tag for consistent, meaningful colors.
export const TAG_TONE: Record<
  PropertyTag,
  "neutral" | "blue" | "green" | "amber" | "red" | "violet"
> = {
  AsIs: "amber",
  CleanTitle: "green",
  JoinVentures: "violet",
  CompanyOwned: "blue",
  IndividualOwner: "neutral",
  LookingToSell: "green",
  LookingForBuyer: "blue",
};

export const PROPERTY_TYPES: PropertyType[] = [
  "Office",
  "Warehouse",
  "Agricultural",
  "Mixed Use",
  "Gas Station",
  "Retail",
];

export const EMOJIS = [
  "😀", "😂", "😍", "😎", "😉", "🤝", "👍", "🙏", "🔥", "🎉",
  "❤️", "💰", "🏢", "🏠", "📈", "✅", "⭐", "👀", "💯", "🤔",
];

// Default map center — Metro Manila, matching the original app.
export const DEFAULT_MAP_CENTER: [number, number] = [14.58, 121.0];
export const DEFAULT_MAP_ZOOM = 11;

// ── Subscription pricing (PHP) ─────────────────────────────────
// Premium is ₱600/month. Annual = 12 months billed up-front with 20% off,
// i.e. 600 × 12 × 0.8 = ₱5,760/year (₱1,440 saved vs paying monthly).
export const PREMIUM_PRICE_MONTHLY = 600;
export const ANNUAL_DISCOUNT_PCT = 20;
export const PREMIUM_PRICE_ANNUAL = Math.round(
  PREMIUM_PRICE_MONTHLY * 12 * (1 - ANNUAL_DISCOUNT_PCT / 100)
); // 5760
export const ANNUAL_SAVINGS = PREMIUM_PRICE_MONTHLY * 12 - PREMIUM_PRICE_ANNUAL; // 1440

// Basic (free) plan limit. Premium removes the listing cap.
export const BASIC_LISTING_CAP = 5;

// Chat subscription limits.
export const BASIC_GROUP_CAP = 3; // Basic plan: max groups you can create
export const CHAT_RETENTION_DAYS_BASIC = 7;
export const CHAT_RETENTION_DAYS_PREMIUM = 30;

export type BillingInterval = "monthly" | "annual";

// Price for a given plan + interval, in PHP. Basic is always free.
export const planPrice = (
  plan: "basic" | "premium",
  interval: BillingInterval
): number => {
  if (plan === "basic") return 0;
  return interval === "annual" ? PREMIUM_PRICE_ANNUAL : PREMIUM_PRICE_MONTHLY;
};

// ── AI Tools (paid, admin-processed add-on) ───────────────────

export const AI_ANALYSIS_PRICE = 100;
export const AI_COMPARISON_PRICE = 300;

export const aiPrice = (t: AiToolType): number =>
  t === "comparison" ? AI_COMPARISON_PRICE : AI_ANALYSIS_PRICE;

export interface AiToolMeta {
  type: AiToolType;
  name: string;
  price: number;
  minDocs: number;
  maxDocs: number;
  blurb: string;
  descLabel: string;
  descPlaceholder: string;
}

export const AI_TOOLS: AiToolMeta[] = [
  {
    type: "analysis",
    name: "Property Analysis",
    price: AI_ANALYSIS_PRICE,
    minDocs: 1,
    maxDocs: 1,
    blurb: "Upload one property document and get a deeper analysis & insight.",
    descLabel: "What would you like to know?",
    descPlaceholder: "e.g. Assess the title, zoning, and resale potential of this lot.",
  },
  {
    type: "comparison",
    name: "Property Comparison",
    price: AI_COMPARISON_PRICE,
    minDocs: 2,
    maxDocs: 4,
    blurb: "Upload 2–4 property documents and compare them side by side.",
    descLabel: "What do you want to compare?",
    descPlaceholder: "e.g. Compare price per sqm, location, and clean-title status across these.",
  },
];
