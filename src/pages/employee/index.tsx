import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/services/api";
import type { AssetStats, Floor } from "@/types/floorPlan";

function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);

  useEffect(() => {
    apiFetch<AssetStats>("/assets/stats").then(setStats).catch(console.error);
    apiFetch<{ floors: Floor[] }>("/floors").then(({ floors }) => setFloors(floors)).catch(console.error);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const userFloor = floors.find((f) => f.id === user?.floor_id);

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-bold text-ink">Welcome, {user?.name}</h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-line">
                Employee
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Assigned to: <span className="font-semibold text-ink">{userFloor ? userFloor.name : user?.floor_id ?? "All Floors"}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-background transition-colors"
          >
            Log out
          </button>
        </header>

        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Workplace Items</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-primary">{stats.present}</span>
                <span className="text-xs text-muted">available</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Available Floors</span>
              <div className="mt-1">
                <span className="font-display text-2xl font-bold text-ink">{floors.length}</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 shadow-card col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Interactive Navigation</span>
              <div className="mt-1">
                <span className="text-xs text-emerald-700 font-medium">● Map Live &amp; Ready</span>
              </div>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink">Floor Map &amp; Device Locator</h2>
          <p className="mt-1 text-sm text-muted">
            Search laptops, monitors, workstations, meeting rooms, and get walking directions on any floor.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/floor-map"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-forest-600 transition-colors"
            >
              <span>🗺️</span> Open Interactive Floor Map
            </Link>
          </div>
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
