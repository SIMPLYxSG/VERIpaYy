import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, ApiError } from "@/services/api";
import type { User } from "@/types/auth";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", floor_id: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadEmployees = useCallback(() => {
    apiFetch<{ employees: User[] }>("/admin/employees")
      .then(({ employees }) => setEmployees(employees))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load employees."));
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiFetch("/admin/employees", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", floor_id: "" });
      loadEmployees();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create employee.");
    } finally {
      setSubmitting(false);
    }
  };

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
            <p className="text-sm text-muted">Manage employee accounts and the floor map.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/floor-map" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink">
              Floor Map
            </Link>
            <button onClick={handleLogout} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink">
              Log out
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg text-ink">Add employee</h2>
          <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-ink">
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink">
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink">
              Temporary password
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink">
              Floor
              <input
                required
                placeholder="e.g. 1"
                value={form.floor_id}
                onChange={(e) => setForm((f) => ({ ...f, floor_id: e.target.value }))}
                className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </label>

            {formError && <p className="sm:col-span-2 text-sm text-danger">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface disabled:opacity-60 sm:col-span-2 sm:w-fit"
            >
              {submitting ? "Adding…" : "Add employee"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg text-ink">Employees</h2>
          {loadError && <p className="mt-2 text-sm text-danger">{loadError}</p>}
          {employees.length === 0 && !loadError ? (
            <p className="mt-2 text-sm text-muted">No employees yet.</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Floor</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-t border-line">
                    <td className="py-2 text-ink">{employee.name}</td>
                    <td className="py-2 text-muted">{employee.email}</td>
                    <td className="py-2 text-muted">{employee.floor_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
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
