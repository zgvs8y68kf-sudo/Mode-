"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, firebaseEnabled } from "@/lib/firebase";
import { migrateLocalToCloud } from "@/lib/store";

type AuthState = { user: User | null; loading: boolean; enabled: boolean };
const Ctx = createContext<AuthState>({ user: null, loading: true, enabled: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: firebaseEnabled, enabled: firebaseEnabled });
  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth(), async (user) => {
      // Première connexion : on reprend les données créées sans compte sur cet appareil.
      if (user) await migrateLocalToCloud(user.uid).catch((e) => console.error("Migration :", e));
      setState({ user, loading: false, enabled: true });
    });
  }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
