import AuthGate from "@/components/AuthGate";
import PropertyTeaserBuilder from "@/components/teaser/PropertyTeaserBuilder";

export default function PropertyTeaserPage() {
  return (
    <AuthGate requirePremium>
      <div className="flex h-full flex-col">
        <header className="border-b border-line bg-white px-6 py-4">
          <h1 className="text-xl font-bold">Property Teaser</h1>
          <p className="text-xs text-slate-400">
            Build a shareable one-page teaser for a listing — fill in the details, preview live, then export to PDF or image.
          </p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
          <PropertyTeaserBuilder />
        </div>
      </div>
    </AuthGate>
  );
}
