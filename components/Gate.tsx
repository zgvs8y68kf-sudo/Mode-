"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Landing from "./Landing";

/** Avec Firebase activé, l'app (et donc l'IA) est réservée aux personnes connectées. */
export default function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading, enabled } = useAuth();
  const path = usePathname();
  if (!enabled || path === "/compte") return <>{children}</>;
  if (loading) return null;
  return user ? <>{children}</> : <Landing />;
}
