import { useRouter } from "next/router";
import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { useAuth } from "@/hooks/useAuth";

function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink">Welcome, {user?.name}</h1>
            <p className="text-sm text-muted">Floor {user?.floor_id ?? "—"}</p>
          </div>
          <button onClick={handleLogout} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink">
            Log out
          </button>
        </header>

        <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg text-ink">Floor Map</h2>
          <p className="mt-1 text-sm text-muted">
            View your floor's layout and find devices and rooms.
          </p>
          <Link
            href="/floor-map"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface"
          >
            Open floor map
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function EmployeePage() {
  return (
    <RoleGate role="employee">
      <EmployeeDashboard />
    </RoleGate>
  );
}
