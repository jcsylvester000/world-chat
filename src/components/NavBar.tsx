"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/NotificationBell";
import { cn, displayName } from "@/lib/utils";

const NAV = [
  { label: "Map", href: "/dashboard" },
  { label: "Browse", href: "/all-listings" },
  { label: "Saved", href: "/saved" },
  { label: "My Listings", href: "/my-listings" },
  { label: "Leads", href: "/leads" },
  { label: "Messages", href: "/messages" },
  { label: "People", href: "/people" },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const go = (href: string) => {
    setOpen(false);
    setNavOpen(false);
    router.push(href);
  };

  const logout = () => {
    setOpen(false);
    signOut();
    router.replace("/login");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line glass px-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:px-6">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 font-bold text-white shadow-sm transition group-hover:scale-105 group-hover:shadow-md">
            W
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">
            World<span className="text-primary">Chat</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive(n.href)
                  ? "bg-primary-50 text-primary ring-1 ring-primary-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              )}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setNavOpen((v) => !v)}
          className="btn-ghost md:hidden"
          aria-label="Menu"
        >
          ☰
        </button>

        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100"
          >
            <Avatar email={user?.email ?? ""} size={36} />
            <span className="hidden text-sm font-medium text-ink sm:inline">
              {user ? displayName(user.email) : ""}
            </span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl">
                <div className="border-b border-line px-4 py-3">
                  <p className="text-sm font-semibold text-ink">
                    {user?.username}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user?.email}
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium capitalize text-primary">
                    {user?.plan} plan
                  </span>
                </div>
                {[
                  { label: "Account Settings", href: "/account" },
                  { label: "My Listings", href: "/my-listings" },
                  { label: "Viewings", href: "/viewings" },
                  { label: "Analytics", href: "/analytics" },
                  { label: "Messages", href: "/messages" },
                  { label: "People", href: "/people" },
                  { label: "Subscription", href: "/subscription" },
                  { label: "Support", href: "/support" },
                  { label: "AI Tools", href: "/ai-tools" },
                  { label: "Property Teaser", href: "/property-teaser" },
                ].map((m) => (
                  <button
                    key={m.href}
                    onClick={() => go(m.href)}
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {m.label}
                  </button>
                ))}
                {user?.isAdmin && (
                  <button
                    onClick={() => go("/admin")}
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Admin
                  </button>
                )}
                <div className="my-1 border-t border-line" />
                <button
                  onClick={logout}
                  className="block w-full px-4 py-2 text-left text-sm font-medium text-danger hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {navOpen && (
        <div className="absolute left-0 right-0 top-16 z-20 border-b border-line bg-white p-2 shadow-lg md:hidden">
          {NAV.map((n) => (
            <button
              key={n.href}
              onClick={() => go(n.href)}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium",
                isActive(n.href)
                  ? "bg-primary-50 text-primary"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
