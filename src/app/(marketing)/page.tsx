import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WorldChat — The World Chat for Real Estate",
  description:
    "Build your real estate network. Add people, post properties, chat and message — all in one app. AI on request for property insights, teasers, and market activity. Grow leads, listings, and your own community.",
};

const FEATURES = [
  { icon: "🤝", title: "Build your network", body: "Add people by invite code, send and accept connection requests, and grow real relationships with buyers, sellers, brokers, and agents." },
  { icon: "🏢", title: "Post your properties", body: "List with photos, documents, tags, and a map pin. Control exactly what buyers see — price, attachments, and Authority to Sell." },
  { icon: "💬", title: "Chat & message", body: "1-on-1 DMs, private groups, and a public World Chat — with photos and emoji. Keep every conversation in one place." },
  { icon: "📨", title: "Capture leads", body: "Buyers request documents or the ATS; you review their Letter of Intent and approve in one tap. Every lead, organized by property." },
  { icon: "🗺️", title: "Live map discovery", body: "Browse properties on an interactive map, filter by type, price, tags, and ATS, and fly straight to any listing." },
  { icon: "🧑‍🤝‍🧑", title: "Groups & community", body: "Create deal rooms and interest groups, invite members, and keep your community engaged and informed." },
];

const AI = [
  { icon: "📊", title: "Property Insights", body: "Get AI-assisted insights on a property — on request, when you need them." },
  { icon: "✨", title: "Property Teasers", body: "Turn a listing into a polished, shareable teaser in seconds." },
  { icon: "📈", title: "Market Activity", body: "Stay on top of market-related activity to time your moves." },
];

const GROW = [
  { icon: "🌱", k: "Grow Leads", v: "Turn requests and conversations into qualified, trackable leads." },
  { icon: "📋", k: "Grow Listings", v: "Publish faster, manage visibility, and reach more serious buyers." },
  { icon: "🌍", k: "Grow Community", v: "Build groups and a network that compounds over time." },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="aurora relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-50 to-transparent" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white px-3 py-1 text-xs font-medium text-primary shadow-sm">
              🌐 The world chat for real estate
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Build your real estate{" "}
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">network</span>.
              All in one app.
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              WorldChat is where real estate connects. Build your network, add people, post your
              properties, and message, chat, and keep everything in one place — designed to help you
              grow within or beyond real estate.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary !px-6 !py-3 text-base">Get started — it&apos;s free</Link>
              <Link href="/all-listings" className="btn-outline !px-6 !py-3 text-base">Browse the map</Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">Grow leads · Grow listings · Grow your own community and groups.</p>
          </div>

          {/* Hero visual */}
          <div className="relative animate-fade-up [animation-delay:140ms]">
            <div className="hover-lift overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://picsum.photos/seed/worldchat-hero/960/560" alt="Featured commercial property" className="h-64 w-full object-cover sm:h-80" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink">Prime Makati Office Floor</p>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">✓ Has ATS</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">📍 Makati, Metro Manila · ₱85,000,000</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden w-56 rounded-xl border border-line bg-white p-3 shadow-xl sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">World Chat</p>
              <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Any new listings this week? 👀</div>
              <div className="ml-6 mt-1 rounded-lg bg-primary/10 p-2 text-xs text-primary">Posted a Tagaytay lot ✅</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink">Everything you need to connect and close</h2>
          <p className="mt-3 text-slate-600">One platform for your network, your listings, and your conversations.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-2xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-ink">Real listings. Real conversations.</h2>
            <p className="mt-3 text-slate-600">Browse properties on the map and connect with the people behind them.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { seed: "wc-office", t: "Offices & towers" },
              { seed: "wc-warehouse", t: "Industrial & warehouses" },
              { seed: "wc-land", t: "Land & agri-estates" },
            ].map((c) => (
              <div key={c.seed} className="overflow-hidden rounded-2xl border border-line shadow-sm transition hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://picsum.photos/seed/${c.seed}/640/420`} alt={c.t} loading="lazy" decoding="async" className="h-44 w-full object-cover" />
                <p className="bg-white p-4 text-sm font-semibold text-ink">{c.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section className="bg-ink py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium">AI on request</span>
            <h2 className="mt-4 text-3xl font-bold">Smarter decisions, on demand</h2>
            <p className="mt-3 text-slate-300">Use AI when you need it — for property insights, polished teasers, and market-related activity.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {AI.map((a) => (
              <div key={a.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-3xl">{a.icon}</div>
                <h3 className="mt-3 text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grow */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink">Designed to help you grow</h2>
          <p className="mt-3 text-slate-600">Within real estate — or beyond it.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {GROW.map((g) => (
            <div key={g.k} className="rounded-2xl border border-line bg-gradient-to-b from-white to-slate-50 p-6 text-center shadow-sm">
              <div className="text-3xl">{g.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-ink">{g.k}</h3>
              <p className="mt-2 text-sm text-slate-600">{g.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-600 px-6 py-14 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold">Your real estate world, in one chat.</h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">Join WorldChat and start building your network, listings, and community today.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary shadow hover:bg-blue-50">Create your account</Link>
            <Link href="/login" className="rounded-lg border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10">Log in</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
