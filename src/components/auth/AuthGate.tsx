import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status !== "authenticated") return null;

  return <>{children}</>;
}
