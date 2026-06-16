"use client";

import { EMOJIS } from "@/lib/constants";

export default function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="absolute bottom-14 left-2 z-20 grid w-56 grid-cols-7 gap-1 rounded-xl border border-line bg-white p-2 shadow-xl">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="grid h-7 w-7 place-items-center rounded text-lg transition hover:bg-slate-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
