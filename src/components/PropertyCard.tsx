"use client";

import { memo } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import PropertyTags from "@/components/PropertyTags";
import { displayName, formatDate, formatPeso } from "@/lib/utils";
import type { Property } from "@/lib/types";

function PropertyCard({
  property,
  onDm,
  currentUserId,
}: {
  property: Property;
  onDm?: (ownerId: string) => void;
  currentUserId?: string;
}) {
  const cover = property.photos[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/listings/${property.id}`} className="relative block">
        <div className="aspect-[16/10] overflow-hidden bg-slate-100">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={property.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-slate-300">No photo</div>
          )}
        </div>
        <div className="absolute left-3 top-3">
          <Badge tone="blue" className="bg-white/90 shadow-sm backdrop-blur">
            {property.type}
          </Badge>
        </div>
        {property.photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {property.photos.length} photos
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/listings/${property.id}`}
          className="font-semibold text-ink hover:text-primary"
        >
          {property.title}
        </Link>
        <p className="mt-0.5 text-sm text-slate-500">📍 {property.location}</p>
        <p className="text-xs text-slate-400">Listed {formatDate(property.createdAt)}</p>

        <p className="mt-2 text-lg font-bold text-ink">
          {property.showPrice ? (
            formatPeso(property.price)
          ) : (
            <span className="text-base font-semibold text-slate-400">
              Price on request
            </span>
          )}
        </p>

        <div className="mt-3">
          <PropertyTags tags={property.tags} limit={3} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <Avatar email={property.ownerEmail} size={28} />
            <span className="text-xs text-slate-500">
              {displayName(property.ownerEmail)}
            </span>
          </div>
          {onDm && property.ownerId !== currentUserId && (
            <button
              onClick={() => onDm(property.ownerId)}
              className="btn-outline !px-3 !py-1.5 text-xs"
            >
              💬 Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(PropertyCard);
