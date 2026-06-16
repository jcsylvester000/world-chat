import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-2xl font-bold text-white shadow-lg">W</div>
      <h1 className="mt-6 text-4xl font-extrabold text-ink">404</h1>
      <p className="mt-2 text-slate-600">We couldn&apos;t find that page.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">Back to home</Link>
        <Link href="/dashboard" className="btn-outline">Open the app</Link>
      </div>
    </div>
  );
}
