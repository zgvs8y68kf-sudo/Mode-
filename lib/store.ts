"use client";

import { get, set } from "idb-keyval";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, writeBatch, type Unsubscribe,
} from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { db } from "./firebase";
import type { Item, Profile, WornEntry } from "./types";

// Données :
//  - connecté (Firebase) → Firestore : users/{uid} { profile, history, audit } + users/{uid}/items/{id}
//  - sinon → IndexedDB locale (mode hors compte, ou Firebase non configuré)

type Cloud<T> = {
  subscribe: (uid: string, cb: (v: T | undefined) => void) => Unsubscribe;
  write: (uid: string, prev: T, next: T) => Promise<void>;
};

/** Firestore refuse `undefined` : on nettoie via JSON. */
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v ?? null));
const userDoc = (uid: string) => doc(db(), "users", uid);

function fieldCloud<T>(field: string): Cloud<T> {
  return {
    subscribe: (uid, cb) => onSnapshot(userDoc(uid), (s) => cb((s.get(field) ?? undefined) as T | undefined)),
    // mergeFields : remplace entièrement ce champ sans toucher aux autres.
    write: (uid, _prev, next) => setDoc(userDoc(uid), { [field]: clean(next) }, { mergeFields: [field] }),
  };
}

const itemsCloud: Cloud<Item[]> = {
  subscribe: (uid, cb) =>
    onSnapshot(query(collection(userDoc(uid), "items"), orderBy("createdAt", "desc")), (s) =>
      cb(s.docs.map((d) => d.data() as Item)),
    ),
  async write(uid, prev, next) {
    const before = new Map(prev.map((i) => [i.id, JSON.stringify(i)]));
    const ids = new Set(next.map((i) => i.id));
    const batch = writeBatch(db());
    let ops = 0;
    for (const it of next)
      if (before.get(it.id) !== JSON.stringify(it)) { batch.set(doc(userDoc(uid), "items", it.id), clean(it)); ops++; }
    for (const it of prev)
      if (!ids.has(it.id)) { batch.delete(doc(userDoc(uid), "items", it.id)); ops++; }
    if (ops) await batch.commit();
  },
};

function useSynced<T>(key: string, initial: T, cloud: Cloud<T>) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const current = useRef(value);
  const initialRef = useRef(initial);

  useEffect(() => {
    if (authLoading) return;
    setReady(false);
    const apply = (v: T | undefined) => {
      const val = v ?? initialRef.current;
      current.current = val;
      setValue(val);
      setReady(true);
    };
    if (uid) return cloud.subscribe(uid, apply);
    let cancelled = false;
    get<T>(key).then((v) => !cancelled && apply(v), () => !cancelled && apply(undefined));
    return () => { cancelled = true; };
  }, [uid, authLoading, key, cloud]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = current.current;
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      current.current = v;
      setValue(v);
      if (uid) cloud.write(uid, prev, v).catch((e) => console.error("Sauvegarde Firestore :", e));
      else set(key, v);
    },
    [uid, key, cloud],
  );

  return [value, update, ready] as const;
}

const profileCloud = fieldCloud<Profile | null>("profile");
const historyCloud = fieldCloud<WornEntry[]>("history");
const auditCloud = fieldCloud<unknown>("audit");

export const useProfile = () => useSynced<Profile | null>("profile", null, profileCloud);
export const useItems = () => useSynced<Item[]>("items", [], itemsCloud);
export const useHistory = () => useSynced<WornEntry[]>("history", [], historyCloud);
export const useAudit = <T,>() => useSynced<T | null>("audit", null, auditCloud as Cloud<T | null>);

/** À la première connexion : copie les données locales (créées hors compte) vers Firestore. */
export async function migrateLocalToCloud(uid: string) {
  const snap = await getDoc(userDoc(uid));
  if (snap.exists() && snap.get("profile")) return;
  const [profile, items, history, audit] = await Promise.all([
    get<Profile>("profile"), get<Item[]>("items"), get<WornEntry[]>("history"), get("audit"),
  ]);
  if (!profile && !items?.length) return;
  await setDoc(userDoc(uid), clean({ profile: profile ?? null, history: history ?? [], audit: audit ?? null }), { merge: true });
  const list = items ?? [];
  for (let i = 0; i < list.length; i += 40) {
    const batch = writeBatch(db());
    list.slice(i, i + 40).forEach((it) => batch.set(doc(userDoc(uid), "items", it.id), clean(it)));
    await batch.commit();
  }
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/** Version compacte de la garde-robe envoyée à l'IA (sans les photos). */
export function wardrobeForAI(items: Item[]) {
  return items.map(({ photo, cutout, productImage, aiImage, imageSource, createdAt, price, purchaseDate, store, source, ...rest }) => rest);
}
