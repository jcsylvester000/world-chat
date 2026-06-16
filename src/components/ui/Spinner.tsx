export default function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 py-10 text-sm text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
      {label}
    </div>
  );
}
