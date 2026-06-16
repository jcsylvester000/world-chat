import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Why WorldChat — What makes us different" };

const POINTS = [
  { icon: "🤝", title: "Network-first, not listing-first", body: "Most portals are just classifieds. WorldChat is built around your relationships — add people, build groups, and turn connections into deals." },
  { icon: "📨", title: "Real lead capture with ATS & LOI", body: "Serious buyers provide a Letter of Intent; owners share the Authority to Sell. We make this trusted document exchange simple and trackable — something generic apps don't do." },
  { icon: "💬", title: "Everything in one chat", body: "DMs, groups, and a public World Chat live alongside your listings and leads — no switching between five different tools." },
  { icon: "🔒", title: "You control your visibility", body: "Hide your price, gate your documents, choose who can find you, and decide per-property what buyers see." },
  { icon: "🧠", title: "AI on request", body: "Property insights, teasers, and market activity — on demand, when they actually help, not as noise." },
  { icon: "🌍", title: "Built to grow with you", body: "Grow leads, grow listings, and grow your own community — within real estate or beyond it." },
];

export default function WhyUsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium text-primary">What makes us different</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">Not another listings portal</h1>
        <p className="mt-4 text-lg text-slate-600">WorldChat combines a real estate network, a marketplace, and a chat platform — with trusted document workflows built in.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-2xl">{p.icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{p.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/register" className="btn-primary !px-6 !py-3 text-base">Join WorldChat</Link>
      </div>
    </div>
  );
}
