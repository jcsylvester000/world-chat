import NavBar from "@/components/NavBar";
import AuthGate from "@/components/AuthGate";
import FavoritesInit from "@/components/FavoritesInit";
import DirectoryInit from "@/components/DirectoryInit";

// Shared shell for every authenticated route: top nav + guarded body.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <NavBar />
      <FavoritesInit />
      <DirectoryInit />
      <main className="min-h-0 flex-1 overflow-auto">
        <AuthGate>{children}</AuthGate>
      </main>
    </div>
  );
}
