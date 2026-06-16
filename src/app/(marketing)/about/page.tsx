import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About — WorldChat" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <span className="text-sm font-medium text-primary">About</span>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">The world chat for real estate</h1>
      <p className="mt-5 text-lg text-slate-600">
        WorldChat brings the whole real estate conversation into one place. Instead of juggling
        listings on one app, messages on another, and documents over email, WorldChat unifies your
        network, your properties, and your chats — so deals move faster and nothing slips through the cracks.
      </p>

      <div className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-ink">Why we built it</h2>
          <p className="mt-2 text-slate-600">
            Real estate runs on relationships and trust. Yet the tools agents and investors use are
            scattered and impersonal. We wanted a single space where you can build your network, post
            properties, capture serious leads, and keep every conversation organized — designed to help
            you grow within or beyond real estate.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">What you can do</h2>
          <ul className="mt-2 space-y-2 text-slate-600">
            <li>• Build your network — add people by invite code and grow real connections.</li>
            <li>• Post properties with photos, documents, tags, and a map pin.</li>
            <li>• Chat 1-on-1, in private groups, or the public World Chat.</li>
            <li>• Capture leads with document and Authority-to-Sell requests.</li>
            <li>• Use AI on request for insights, teasers, and market activity.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">Where we&apos;re headed</h2>
          <p className="mt-2 text-slate-600">
            We&apos;re building toward a fully connected, secure platform — backed by a robust database and
            AI that helps you grow leads, listings, and your own community and groups.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
        <p className="font-semibold text-ink">Ready to grow your network?</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/register" className="btn-primary">Get started</Link>
          <Link href="/why-us" className="btn-outline">What makes us different</Link>
        </div>
      </div>
    </div>
  );
}
