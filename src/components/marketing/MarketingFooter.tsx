import Link from "next/link";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Why WorldChat", href: "/why-us" },
      { label: "Pricing", href: "/pricing" },
      { label: "Log in to the app", href: "/login" },
      { label: "Get started", href: "/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Terms & Billing", href: "/terms" },
      { label: "Home", href: "/" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/register" },
      { label: "Subscription", href: "/subscription" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Why WorldChat", href: "/why-us" },
      { label: "FAQ", href: "/faq" },
      { label: "Terms & Billing", href: "/terms" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 font-bold text-white">W</span>
              <span className="text-lg font-bold tracking-tight text-ink">World<span className="text-primary">Chat</span></span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              The world chat for real estate. Build your network, post properties, and grow your community — all in one place.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-ink">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-slate-500 transition hover:text-primary">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} WorldChat. All rights reserved.</p>
          <p className="flex gap-4">
            <Link href="/terms" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms & Billing</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
