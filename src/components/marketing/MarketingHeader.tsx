"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Why us", href: "/why-us" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Pricing", href: "/pricing" },
];

export default function MarketingHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 font-bold text-white shadow-sm">W</span>
          <span className="text-lg font-bold tracking-tight text-ink">World<span className="text-primary">Chat</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition", pathname === n.href ? "bg-primary-50 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-ink")}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {hasHydrated && user ? (
            <Link href="/dashboard" className="btn-primary">Open app →</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/register" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen((v) => !v)} className="btn-ghost md:hidden" aria-label="Menu">☰</button>
      </div>

      {open && (
        <div className="border-t border-line bg-white p-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">{n.label}</Link>
          ))}
          <div className="mt-2 flex gap-2 border-t border-line pt-3">
            {hasHydrated && user ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-primary flex-1">Open app →</Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline flex-1">Log in</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary flex-1">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
