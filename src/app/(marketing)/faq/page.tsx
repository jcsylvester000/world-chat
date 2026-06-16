import Link from "next/link";
import type { Metadata } from "next";
import FaqAccordion, { type FaqItem } from "@/components/marketing/FaqAccordion";

export const metadata: Metadata = { title: "FAQ — WorldChat" };

const GENERAL: FaqItem[] = [
  { q: "What is WorldChat?", a: "WorldChat is the world chat for real estate — a single app to build your network, post properties, capture leads, and message and chat. It brings your connections, listings, and conversations into one place so deals move faster." },
  { q: "Is it free to use?", a: "Yes. The Basic plan is free and lets you build your network, list properties, and chat. Premium unlocks unlimited listings, priority placement, lead capture, and AI on request. See the Pricing page for details." },
  { q: "How is WorldChat different from a listings portal?", a: "Portals are classifieds. WorldChat is network-first: you add people, build groups, exchange trusted documents (ATS and LOI), and keep every conversation alongside your listings — all in one platform." },
];

const NETWORK: FaqItem[] = [
  { q: "How do I build my network and add people?", a: "Every user has a shareable invite code (e.g. WC-7F3K9Q) on the People page. Share it, or search for people who chose to be visible, then send a connection request. Once accepted, you're contacts and can message directly." },
  { q: "Can I control who can find me?", a: "Yes. Choose Visible to everyone, Invite only (reachable just by your code), or Hidden. You can also turn friend requests on or off at any time." },
  { q: "What are groups and the World Chat?", a: "Create private groups (deal rooms, interest groups) and invite members, or post in the public World Chat. Both support photos and emoji. Direct messages, groups, and World Chat all live in one chat panel." },
];

const LISTINGS: FaqItem[] = [
  { q: "How do I post a property?", a: "Tap Add property, add photos, a title, price, type, tags, and drop a pin on the map. You control visibility — show or hide the price and documents, and choose how your Authority to Sell is shown." },
  { q: "What are ATS and LOI?", a: "An Authority to Sell (ATS) proves a seller is authorized to sell; a Letter of Intent (LOI) signals a serious buyer. On WorldChat these are always attachments (real brokers use branded letterhead) and the exchange is built in and tracked per property." },
  { q: "How does requesting documents or the ATS work?", a: "A buyer requests access and, if required, attaches their LOI. The owner reviews it in the Requests inbox and approves in one tap — the documents or ATS then become viewable to that buyer. Every request is its own tracked thread." },
  { q: "Can I hide my price or documents?", a: "Yes — per listing or across all your listings. When hidden, the public sees 'Price on request' and gated documents; you always see everything on your own listings." },
];

const PLATFORM: FaqItem[] = [
  { q: "What are the AI Tools?", a: "AI Tools are a pay-per-request add-on available to every member. Property Analysis (₱100) reviews one property document for deeper insight; Property Comparison (₱300) compares 2–4 documents side by side. You upload your documents and a request, pay the per-request fee with proof of payment, and an admin processes it and delivers the result documents to you." },
  { q: "Do messages get deleted?", a: "Chats are designed to be ephemeral — messages older than 7 days are treated as expired. This keeps conversations fresh and focused on active deals." },
  { q: "How do I upgrade my plan?", a: "Open Subscription in the app, pick monthly or annual, pay via the provided QR, and upload your proof of payment. An admin reviews it, activates your plan, and an invoice is issued to you automatically." },
  { q: "How do I get help or support?", a: "Open Support from the top-right menu. Basic (free) members get ticket-based support for simple issues. Premium members get priority support — tickets jump the queue and an admin can reach you directly. For serious support needs, upgrade to Premium." },
  { q: "Is my data secure?", a: "This preview runs on an in-memory demo layer. The production version is built to connect to a secure PostgreSQL database with proper authentication." },
];

const BILLING: FaqItem[] = [
  { q: "When am I billed?", a: "Billing runs on a calendar month — the period is the 1st to the last day of the month, and payment is always due on the last day of the month. This lines up with the usual 15th/30th payroll cycle." },
  { q: "What if I upgrade mid-month?", a: "Upgrades from Free to Premium are billed on the next cycle, so you are never charged twice in the same month. Your first invoice is issued at the end of the following period." },
  { q: "Is there a grace period?", a: "Yes — there is a 5-day grace period after the due date. If payment still isn't received, the account is automatically downgraded to Basic, and any listings beyond the 5-listing Basic limit are removed (the most recent 5 are kept)." },
  { q: "Do free listings expire?", a: "Free listings expire 6 months after posting, or after 2 months of account inactivity, whichever comes first, and are then removed. Staying active keeps them live. Premium listings don't expire while the subscription is active." },
  { q: "Do I get an invoice?", a: "Yes. When an admin approves your payment, a PDF invoice is generated automatically. You and the admin can both view it, and you can download it any time from the Subscription page." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="text-sm font-medium text-primary">FAQ</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">Frequently asked questions</h1>
        <p className="mt-4 text-lg text-slate-600">Everything you need to know about WorldChat.</p>
      </div>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Getting started</h2>
          <FaqAccordion items={GENERAL} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Network & chat</h2>
          <FaqAccordion items={NETWORK} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Listings, ATS & LOI</h2>
          <FaqAccordion items={LISTINGS} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Platform, AI & plans</h2>
          <FaqAccordion items={PLATFORM} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Billing & subscriptions</h2>
          <FaqAccordion items={BILLING} />
        </section>
      </div>

      <div className="mt-12 rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
        <p className="font-semibold text-ink">Still have questions?</p>
        <p className="mt-1 text-sm text-slate-500">Create an account and explore — it&apos;s free to start.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/register" className="btn-primary">Get started</Link>
          <Link href="/about" className="btn-outline">About WorldChat</Link>
        </div>
      </div>
    </div>
  );
}
