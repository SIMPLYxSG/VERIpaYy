import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, ApiError } from "@/services/api";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import type { User } from "@/types/auth";
import type { Floor, AssetStats, AlertItem } from "@/types/floorPlan";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState<User[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", floor_id: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Deletion modal state
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEmployees = useCallback(() => {
    apiFetch<{ employees: User[] }>("/admin/employees")
      .then(({ employees }) => setEmployees(employees))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load employees."));
  }, []);

  const loadFloors = useCallback(() => {
    apiFetch<{ floors: Floor[] }>("/floors")
      .then(({ floors }) => {
        setFloors(floors);
        if (floors.length > 0 && !form.floor_id) {
          setForm((f) => ({ ...f, floor_id: floors[0].id }));
        }
      })
      .catch((err) => console.error(err));
  }, [form.floor_id]);

  const loadStats = useCallback(() => {
    apiFetch<AssetStats>("/assets/stats")
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  const loadAlerts = useCallback(() => {
    apiFetch<{ alerts: AlertItem[]; unreadCount: number }>("/admin/alerts?limit=10")
      .then((data) => {
        setAlerts(data.alerts);
        setUnreadAlertsCount(data.unreadCount);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    loadEmployees();
    loadFloors();
    loadStats();
    loadAlerts();
  }, [loadEmployees, loadFloors, loadStats, loadAlerts]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiFetch("/admin/employees", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", floor_id: floors[0]?.id ?? "" });
      setActionSuccess("Employee account created successfully!");
      setTimeout(() => setActionSuccess(null), 3000);
      loadEmployees();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create employee.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/admin/employees/${employeeToDelete.id}`, { method: "DELETE" });
      setActionSuccess(`Employee ${employeeToDelete.name} deleted.`);
      setTimeout(() => setActionSuccess(null), 3000);
      setEmployeeToDelete(null);
      loadEmployees();
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not delete employee.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-bold text-ink">Welcome, {user?.name}</h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                Administrator
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Manage workplace employee accounts, floor maps, and hardware inventory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/floor-map"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-forest-600 transition-colors"
            >
              <span>🗺️</span> Open Floor Map
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-background transition-colors"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Feedback banners */}
        {actionSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex items-center justify-between">
            <span>✓ {actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="text-xs font-bold">✕</button>
          </div>
        )}

        {loadError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-danger flex items-center justify-between">
            <span>{loadError}</span>
            <button onClick={() => setLoadError(null)} className="text-xs font-bold">✕</button>
          </div>
        )}

        {/* Workplace Overview Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Present Items</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-primary">{stats.present}</span>
                <span className="text-xs text-muted">/ {stats.total} total</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Employees</span>
              <div className="mt-1">
                <span className="font-display text-2xl font-bold text-ink">{employees.length}</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Floors</span>
              <div className="mt-1">
                <span className="font-display text-2xl font-bold text-ink">{floors.length}</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Unusual Movement Alerts</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-danger">{unreadAlertsCount}</span>
                <Link href="/floor-map" className="text-xs text-primary underline">
                  Review &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Add Employee Form */}
        <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink">Add Employee Account</h2>
          <p className="text-xs text-muted mt-0.5">
            Register a new employee with designated floor access permissions.
          </p>

          <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
              Full Name
              <input
                required
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
              Email Address
              <input
                type="email"
                required
                placeholder="e.g. john@veripay.local"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
              Temporary Password
              <input
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
              Assigned Floor
              {floors.length > 0 ? (
                <select
                  value={form.floor_id}
                  onChange={(e) => setForm((f) => ({ ...f, floor_id: e.target.value }))}
                  className="rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name} (Floor {floor.floor_number})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  placeholder="e.g. Floor 1"
                  value={form.floor_id}
                  onChange={(e) => setForm((f) => ({ ...f, floor_id: e.target.value }))}
                  className="rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              )}
            </label>

            {formError && <p className="sm:col-span-2 text-xs text-danger font-medium">{formError}</p>}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-forest-600 disabled:opacity-60 transition-colors"
              >
                {submitting ? "Adding Employee…" : "+ Add Employee"}
              </button>
            </div>
          </form>
        </section>

        {/* Employee List with Reconfirmed Deletion */}
        <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Registered Employees</h2>
              <p className="text-xs text-muted mt-0.5">
                {employees.length} active employee {employees.length === 1 ? "account" : "accounts"}
              </p>
            </div>
          </div>

          {employees.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No employees registered yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Assigned Floor</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {employees.map((employee) => {
                    const floorObj = floors.find((f) => f.id === employee.floor_id);
                    return (
                      <tr key={employee.id} className="hover:bg-background/40 transition-colors">
                        <td className="py-3 font-medium text-ink">{employee.name}</td>
                        <td className="py-3 text-muted">{employee.email}</td>
                        <td className="py-3 text-muted">
                          <span className="rounded-md bg-background px-2 py-0.5 text-xs font-semibold text-ink border border-line">
                            {floorObj ? floorObj.name : employee.floor_id ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-muted">
                          {new Date(employee.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setEmployeeToDelete(employee)}
                            className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1 text-xs font-semibold text-danger hover:bg-red-100 hover:border-red-300 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Reconfirmation Modal for Employee Deletion */}
      <ConfirmModal
        isOpen={Boolean(employeeToDelete)}
        title="Confirm Employee Account Deletion"
        message={`Are you sure you want to delete ${employeeToDelete?.name} (${employeeToDelete?.email})? This action is permanent and will unassign any hardware assets attached to this employee.`}
        confirmLabel="Yes, Delete Employee"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setEmployeeToDelete(null)}
      />
    </main>
  );
}

export default function AdminPage() {
  return (
    <RoleGate role="admin">
      <AdminDashboard />
    </RoleGate>
  );
}
