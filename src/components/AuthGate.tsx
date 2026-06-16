"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth-store";

// Client-side route guard for the authenticated app shell. Waits for the
// persisted auth state to hydrate, then redirects to /login (or /dashboard
// for admin-only pages). Also enforces account deactivation mid-session and
// an optional Premium-only wall.
export default function AuthGate({
  children,
  requireAdmin = false,
  requirePremium = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
  requirePremium?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
    } else if (!user.active) {
      // Deactivated while logged in — sign out immediately.
      signOut();
      router.replace("/login");
    } else if (requireAdmin && !user.isAdmin) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, user, requireAdmin, router, signOut]);

  // Keep the session user fresh (e.g. plan changes / deactivation by an admin).
  useEffect(() => {
    if (hasHydrated && user) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  // Re-check on tab focus so an open page reflects an admin's plan change or
  // deactivation without a manual reload.
  useEffect(() => {
    const onFocus = () => {
      if (useAuthStore.getState().user) refreshUser();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUser]);

  if (!hasHydrated || !user || !user.active || (requireAdmin && !user.isAdmin)) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  // Premium-only feature wall (admins always pass).
  if (requirePremium && user.plan !== "premium" && !user.isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl border border-primary bg-primary-50 p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-2xl text-white">⭐</div>
          <h1 className="text-xl font-bold text-ink">Premium feature</h1>
          <p className="mt-2 text-sm text-slate-600">
            The AI Property Teaser is included with Premium. Upgrade to unlock it, plus unlimited
            listings, priority placement, and priority support. (Pay-per-request AI Tools are
            available to everyone under AI Tools.)
          </p>
          <Link href="/subscription" className="btn-primary mt-5 inline-block">Upgrade to Premium</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
