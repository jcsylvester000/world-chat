import NavBar from "@/components/NavBar";
import AuthGate from "@/components/AuthGate";

// Shared shell for every authenticated route: top nav + guarded body.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <NavBar />
      <main className="min-h-0 flex-1 overflow-auto">
        <AuthGate>{children}</AuthGate>
      </main>
    </div>
  );
}
