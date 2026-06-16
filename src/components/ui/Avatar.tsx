"use client";

import { cn, initials } from "@/lib/utils";

// Deterministic gradient avatar from an email/name.
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
}: {
  email: string;
  size?: number;
  className?: string;
}) {
  const grad = palette[hash(email || "?") % palette.length];
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white",
        grad,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      title={email}
    >
      {initials(email)}
    </span>
  );
}
