import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "@/services/api";
import type { Role, User } from "@/types/auth";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: Status;
  login: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    apiFetch<{ user: User }>("/auth/me")
      .then(({ user }) => {
        setUser(user);
        setStatus("authenticated");
      })
      .catch(() => {
        setUser(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string, role: Role) => {
    const { user } = await apiFetch<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    setUser(user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
