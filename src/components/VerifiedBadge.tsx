"use client";

import { useDirectoryStore } from "@/lib/store/directory-store";
import { cn } from "@/lib/utils";

// Shows a "Verified" pill when the profile (by email) is a verified broker.
export default function VerifiedBadge({
  email,
  size = "sm",
  showLabel = true,
  className,
}: {
  email: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const profile = useDirectoryStore((s) => s.byEmail[email]);
  if (!profile?.verified) return null;
  const title = profile.company ? `Verified broker · ${profile.company}` : "Verified broker";
  const px = size === "sm" ? 11 : 13;
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-sky-100 font-medium text-sky-700",
        showLabel ? (size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs") : "p-0.5",
        className
      )}
    >
      <svg viewBox="0 0 24 24" width={px} height={px} fill="currentColor" aria-hidden="true">
        <path d="M12 1l2.4 2.4 3.4-.5.5 3.4L21 9l-1.7 3 1.7 3-2.3 2.2-.5 3.4-3.4-.5L12 23l-2.4-2.4-3.4.5-.5-3.4L3 15l1.7-3L3 9l2.3-2.2.5-3.4 3.4.5L12 1zm-1.2 14.3l5.3-5.3-1.4-1.4-3.9 3.9-1.8-1.8L7.6 12l3.2 3.3z" />
      </svg>
      {showLabel && "Verified"}
    </span>
  );
}
