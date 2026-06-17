// Small presentation helpers shared across components.

export type ClassValue = string | false | null | undefined;

// Tiny classnames joiner (clsx-lite) for conditional Tailwind classes.
export const cn = (...classes: ClassValue[]) =>
  classes.filter(Boolean).join(" ");

export const initials = (value: string) => {
  const v = (value ?? "").trim();
  if (!v) return "?";
  const parts = v.split(/[@.\s]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase();
};

export const displayName = (email: string) =>
  (email ?? "").split("@")[0] || email;

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const formatPeso = (n: number) => `₱${n.toLocaleString()}`;

// Compact peso, e.g. ₱85M, ₱1.2B — nice for cards.
export const formatPesoCompact = (n: number) => {
  if (n >= 1_000_000_000) return `₱${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`;
  return `₱${n.toLocaleString()}`;
};

export const humanizeTag = (tag: string) =>
  tag.replace(/([A-Z])/g, " $1").trim();

// Read a File into a base64 data URL (used for in-memory photo previews).
// Request a smaller width for remote (Unsplash/picsum) images so small cards
// don't download full-size photos. Leaves data: URLs and unknown hosts as-is.
export const thumb = (url: string, w: number): string => {
  if (!url || url.startsWith("data:")) return url;
  if (/[?&]w=\d+/.test(url)) return url.replace(/([?&]w=)\d+/, `$1${w}`);
  if (url.includes("images.unsplash.com")) return url + (url.includes("?") ? "&" : "?") + `w=${w}`;
  return url;
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Generate a shareable friend code, e.g. "WC-7F3K9Q".
export const genFriendCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `WC-${s}`;
};
