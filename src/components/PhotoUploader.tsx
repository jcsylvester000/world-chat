"use client";

import { fileToDataUrl } from "@/lib/utils";

// Multi-photo picker that reads files into base64 data URLs and shows
// live thumbnails. Swap fileToDataUrl for a real upload later.
export default function PhotoUploader({
  photos,
  onChange,
  max = 8,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls = await Promise.all(files.map(fileToDataUrl));
    onChange([...photos, ...urls].slice(0, max));
    e.target.value = "";
  };

  const remove = (idx: number) =>
    onChange(photos.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((src, i) => (
          <div
            key={src.slice(0, 64) + i}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}

        {photos.length < max && (
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line text-slate-400 transition hover:border-primary hover:text-primary">
            <span className="text-2xl leading-none">+</span>
            <span className="mt-1 text-xs">Add photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPick}
            />
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {photos.length}/{max} photos
      </p>
    </div>
  );
}
