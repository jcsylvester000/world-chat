"use client";

import { memo } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import FavoriteButton from "@/components/FavoriteButton";
import { formatDate, formatPeso, thumb } from "@/lib/utils";
import type { Property } from "@/lib/types";

// Compact horizontal listing row — small thumbnail so many fit in the
// narrow dashboard column. Shows the upload date.
function PropertyListItem({
  property,
  onDm,
  currentUserId,
}: {
  property: Property;
  onDm?: (ownerId: string) => void;
  currentUserId?: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-white p-2 transition hover:shadow-sm">
      <Link
        href={`/listings/${property.id}`}
        className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100"
      >
        {property.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb(property.photos[0], 160)}
            alt={property.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/listings/${property.id}`}
            className="truncate text-sm font-semibold text-ink hover:text-primary"
          >
            {property.title}
          </Link>
          <Badge tone="blue" className="shrink-0 !px-2 !py-0 text-[10px]">
            {property.type}
          </Badge>
        </div>
        <p className="truncate text-xs text-slate-500">
          📍 {property.location} · {formatDate(property.createdAt)}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">
            {property.showPrice ? (
              formatPeso(property.price)
            ) : (
              <span className="text-xs font-medium text-slate-400">On request</span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <FavoriteButton
              propertyId={property.id}
              property={property}
              size={16}
              className="!bg-transparent !p-1 !shadow-none"
            />
            {onDm && property.ownerId !== currentUserId && (
              <button
                onClick={() => onDm(property.ownerId)}
                className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
              >
                💬 Message
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PropertyListItem);
