import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.role === "admin" ? "/admin" : "/employee");
    }
  }, [status, user, router]);

  if (status === "loading" || status === "authenticated") return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <div>
        <h1 className="font-display text-4xl text-ink">VeriPay</h1>
        <p className="mt-2 text-sm text-muted">Access control and asset tracking for your workplace.</p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/login/admin"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-surface shadow-card"
        >
          Admin Login
        </Link>
        <Link
          href="/login/employee"
          className="rounded-lg border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-card"
        >
          Employee Login
        </Link>
      </div>
    </main>
  );
}
