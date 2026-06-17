"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";

export interface QuickItem {
  key: string;
  kind: "world" | "group" | "dm" | "person";
  label: string;
  sub?: string;
  email?: string;
  badge?: number;
  run: () => void;
}

// Cmd/Ctrl-K command palette for jumping between conversations and people.
export default function QuickSwitcher({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: QuickItem[];
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((it) => it.label.toLowerCase().includes(q) || it.sub?.toLowerCase().includes(q))
    : items;
  const sel = Math.min(index, Math.max(0, filtered.length - 1));

  const choose = (it?: QuickItem) => {
    if (!it) return;
    it.run();
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(filtered[sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const icon = (it: QuickItem) => {
    if (it.kind === "world") return <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-base">🌐</span>;
    if (it.kind === "group")
      return (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-sm font-semibold text-primary">
          {it.label.charAt(0).toUpperCase()}
        </span>
      );
    return <Avatar email={it.email ?? ""} size={32} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <span className="text-slate-400">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a conversation or person…"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-slate-400">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">No matches.</li>}
          {filtered.map((it, i) => (
            <li key={it.key}>
              <button
                type="button"
                onMouseEnter={() => setIndex(i)}
                onClick={() => choose(it)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === sel ? "bg-primary-50" : "hover:bg-slate-50"}`}
              >
                {icon(it)}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{it.label}</span>
                  {it.sub && <span className="block truncate text-xs text-slate-400">{it.sub}</span>}
                </span>
                {!!it.badge && it.badge > 0 && (
                  <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                    {it.badge}
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wide text-slate-300">{it.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
