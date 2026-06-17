"use client";

import { cn, initials } from "@/lib/utils";

// Deterministic gradient avatar from an email/name. Pass `online` to render a
// presence dot (green = online, grey = offline); omit it for no dot.
const palette = [
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-cyan-500 to-sky-500",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({
  email,
  size = 36,
  className,
  online,
}: {
  email: string;
  size?: number;
  className?: string;
  online?: boolean;
}) {
  const grad = palette[hash(email || "?") % palette.length];
  const dot = Math.max(8, Math.round(size * 0.3));
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
      title={email}
    >
      <span
        className={cn(
          "grid h-full w-full place-items-center rounded-full bg-gradient-to-br font-semibold text-white",
          grad
        )}
        style={{ fontSize: size * 0.42 }}
      >
        {initials(email)}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            online ? "bg-emerald-500" : "bg-slate-300"
          )}
          style={{ width: dot, height: dot }}
        />
      )}
    </span>
  );
}
