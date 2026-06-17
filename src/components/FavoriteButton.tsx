"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import { useFavoritesStore } from "@/lib/store/favorites-store";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/types";

// Heart toggle for saving a listing. Reads the reactive `ids` set so it
// flips instantly across every card showing the same property.
export default function FavoriteButton({
  propertyId,
  property,
  className,
  size = 20,
}: {
  propertyId: string;
  property?: Property;
  className?: string;
  size?: number;
}) {
  const user = useAuthStore((s) => s.user);
  const isFav = useFavoritesStore((s) => s.ids.has(propertyId));
  const toggle = useFavoritesStore((s) => s.toggle);

  if (!user) return null;

  return (
    <button
      type="button"
      aria-label={isFav ? "Remove from saved" : "Save listing"}
      aria-pressed={isFav}
      title={isFav ? "Saved" : "Save"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(user.id, propertyId, property);
      }}
      className={cn(
        "grid place-items-center rounded-full bg-white/85 p-1.5 shadow-sm backdrop-blur transition hover:bg-white",
        isFav ? "text-rose-500" : "text-slate-400 hover:text-rose-400",
        className
      )}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}
