"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePropertyStore } from "@/lib/store/property-store";
import { formatPeso } from "@/lib/utils";
import type { Property } from "@/lib/types";

// Detects property links (/listings/<id>) and other URLs inside a message and
// renders rich preview cards (Dissent-style embeds), adapted to this app.
const PROP_RE = /\/listings\/([A-Za-z0-9_-]+)/g;
const URL_RE = /https?:\/\/[^\s)]+/g;

function PropertyEmbed({ property }: { property: Property }) {
  const cover = property.photos[0];
  return (
    <Link
      href={`/listings/${property.id}`}
      className="flex w-72 max-w-full overflow-hidden rounded-xl border border-line bg-white text-ink shadow-sm transition hover:shadow-md"
    >
      <div className="h-20 w-20 shrink-0 bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={property.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-[10px] text-slate-300">No photo</div>
        )}
      </div>
      <div className="min-w-0 flex-1 p-2">
        <p className="truncate text-sm font-semibold">{property.title}</p>
        <p className="truncate text-xs text-slate-500">📍 {property.location}</p>
        <p className="mt-0.5 text-sm font-bold text-primary">
          {property.showPrice ? formatPeso(property.price) : "Price on request"}
        </p>
      </div>
    </Link>
  );
}

function LinkEmbed({ url }: { url: string }) {
  let domain = url;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep raw url */
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-72 max-w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-ink shadow-sm transition hover:shadow-md"
    >
      <span className="text-base">🔗</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{domain}</span>
        <span className="block truncate text-xs text-slate-400">{url}</span>
      </span>
    </a>
  );
}

export default function MessageEmbeds({ content }: { content: string }) {
  const properties = usePropertyStore((s) => s.properties);
  const fetchProperties = usePropertyStore((s) => s.fetch);

  const propIds = [...new Set([...content.matchAll(PROP_RE)].map((m) => m[1]))];
  const urls = [...new Set([...content.matchAll(URL_RE)].map((m) => m[0]))].filter(
    (u) => !u.includes("/listings/")
  );
  const hasPropLink = propIds.length > 0;

  useEffect(() => {
    if (hasPropLink && properties.length === 0) void fetchProperties();
  }, [hasPropLink, properties.length, fetchProperties]);

  const resolved = propIds
    .map((id) => properties.find((p) => p.id === id))
    .filter((p): p is Property => !!p);

  if (resolved.length === 0 && urls.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {resolved.map((p) => (
        <PropertyEmbed key={p.id} property={p} />
      ))}
      {urls.map((u) => (
        <LinkEmbed key={u} url={u} />
      ))}
    </div>
  );
}
