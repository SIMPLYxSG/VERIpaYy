import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/auth";

const LOGIN_PATH: Record<Role, string> = {
  admin: "/login/admin",
  employee: "/login/employee",
};

const DASHBOARD_PATH: Record<Role, string> = {
  admin: "/admin",
  employee: "/employee",
};

interface RoleGateProps {
  role: Role;
  children: ReactNode;
}

export function RoleGate({ role, children }: RoleGateProps) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(LOGIN_PATH[role]);
      return;
    }
    if (user && user.role !== role) {
      router.replace(DASHBOARD_PATH[user.role]);
    }
  }, [status, user, role, router]);

  if (status !== "authenticated" || user?.role !== role) return null;

  return <>{children}</>;
}
