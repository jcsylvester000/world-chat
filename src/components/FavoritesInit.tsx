"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useFavoritesStore } from "@/lib/store/favorites-store";

// Loads the signed-in user's saved listings once so hearts render correctly
// everywhere. Mounted in the authenticated app layout.
export default function FavoritesInit() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const fetch = useFavoritesStore((s) => s.fetch);
  useEffect(() => {
    if (hasHydrated && user) fetch(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user?.id, fetch]);
  return null;
}
