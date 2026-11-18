"use client";

import { useApp } from "./AppProvider";
import Login from "./Login";

/** Avec Firebase, l'app est réservée aux membres connectés. Sans Firebase : mode démo local. */
export default function Gate({ children }: { children: React.ReactNode }) {
  const { enabled, authLoading, user } = useApp();
  if (!enabled) return <>{children}</>;
  if (authLoading) return <p className="pt-10 text-center text-sm text-muted">Chargement…</p>;
  return user ? <>{children}</> : <Login />;
}
