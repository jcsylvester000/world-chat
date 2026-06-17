"use client";

import { displayName } from "@/lib/utils";

// Animated "… is typing" line. Renders nothing when no one is typing.
export default function TypingIndicator({ users }: { users: { userId: string; email: string }[] }) {
  if (users.length === 0) return null;
  const names = users.map((u) => displayName(u.email));
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;
  return (
    <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-400">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
      </span>
      {label}…
    </div>
  );
}
