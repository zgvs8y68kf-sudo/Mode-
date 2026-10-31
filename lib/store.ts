"use client";

import { get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "react";
import type { Item, Profile, WornEntry } from "./types";

// Stockage local (IndexedDB) : tout reste dans le navigateur de l'utilisateur.
// Étape suivante prévue : synchronisation compte (Supabase / Neon via Vercel Marketplace).

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    get<T>(key)
      .then((v) => v !== undefined && setValue(v))
      .finally(() => setReady(true));
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        set(key, v);
        return v;
      });
    },
    [key],
  );

  return [value, update, ready] as const;
}

export const useProfile = () => usePersisted<Profile | null>("profile", null);
export const useItems = () => usePersisted<Item[]>("items", []);
export const useHistory = () => usePersisted<WornEntry[]>("history", []);

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/** Version compacte de la garde-robe envoyée à l'IA (sans les photos). */
export function wardrobeForAI(items: Item[]) {
  return items.map(({ photo, createdAt, ...rest }) => rest);
}
