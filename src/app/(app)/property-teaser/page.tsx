import AuthGate from "@/components/AuthGate";

export default function PropertyTeaserPage() {
  return (
    <AuthGate requirePremium>
      <div className="flex h-full flex-col">
        <header className="border-b border-line bg-white px-6 py-4">
          <h1 className="text-xl font-bold">Property Teaser</h1>
          <p className="text-xs text-slate-400">
            Embedded external tool — if it doesn&apos;t load, it may be temporarily unavailable.
          </p>
        </header>
        <iframe src="https://fancy-cactus-e6763c.netlify.app/" className="min-h-0 flex-1 border-0" title="Property Teaser" />
      </div>
    </AuthGate>
  );
}
