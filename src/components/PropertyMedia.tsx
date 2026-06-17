"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import type { Property } from "@/lib/types";

const isEmbed = (url: string) => /youtube\.com|youtu\.be|vimeo\.com/.test(url);
function embedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

export default function PropertyMedia({ property }: { property: Property }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const video = property.videoUrl ?? "";
  const tour = property.tourUrl ?? "";
  const plans = property.floorPlans ?? [];
  if (!video && !tour && plans.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Media &amp; tours</h2>

      {video &&
        (isEmbed(video) ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <iframe src={embedUrl(video)} className="h-full w-full" allowFullScreen title="Property video" />
          </div>
        ) : (
          <video src={video} controls className="w-full rounded-xl bg-black" />
        ))}

      {tour && (
        <a
          href={tour}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline inline-flex w-full items-center justify-center"
        >
          🌐 Take a 360° virtual tour →
        </a>
      )}

      {plans.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium text-slate-600">Floor plans</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {plans.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightbox(url)}
                className="overflow-hidden rounded-lg border border-line bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Floor plan ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightbox && (
        <Modal onClose={() => setLightbox(null)} className="w-full max-w-3xl">
          <div className="p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="Floor plan" className="w-full rounded-lg" />
          </div>
        </Modal>
      )}
    </div>
  );
}
