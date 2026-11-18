"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, firebaseEnabled } from "@/lib/firebase";
import { LOCAL_UID, subscribePlayers } from "@/lib/store";
import type { Player } from "@/lib/types";

type AppState = {
  enabled: boolean;
  authLoading: boolean;
  user: User | null;
  /** uid Firebase, ou identifiant local en mode démo. */
  uid: string | null;
  players: Record<string, Player>;
  playersLoaded: boolean;
  me: Player | null;
};

const Ctx = createContext<AppState>({
  enabled: false, authLoading: true, user: null, uid: null, players: {}, playersLoaded: false, me: null,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(firebaseEnabled);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const uid = firebaseEnabled ? user?.uid ?? null : LOCAL_UID;

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth(), (u) => { setUser(u); setAuthLoading(false); });
  }, []);

  useEffect(() => {
    if (!uid) { setPlayers({}); setPlayersLoaded(false); return; }
    return subscribePlayers((p) => { setPlayers(p); setPlayersLoaded(true); });
  }, [uid]);

  const me = uid ? players[uid] ?? null : null;
  return (
    <Ctx.Provider value={{ enabled: firebaseEnabled, authLoading, user, uid, players, playersLoaded, me }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
