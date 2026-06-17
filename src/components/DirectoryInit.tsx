"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useDirectoryStore } from "@/lib/store/directory-store";

// Loads the profile directory once so verified badges render everywhere.
export default function DirectoryInit() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const loaded = useDirectoryStore((s) => s.loaded);
  const fetch = useDirectoryStore((s) => s.fetch);
  useEffect(() => {
    if (hasHydrated && !loaded) fetch();
  }, [hasHydrated, loaded, fetch]);
  return null;
}
