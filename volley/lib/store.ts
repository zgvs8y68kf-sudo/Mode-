"use client";

import {
  addDoc, collection, deleteDoc, deleteField, doc, onSnapshot, orderBy, query, setDoc, updateDoc, where,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import { demoPlayers } from "./demo";
import { normalizePlayer } from "./questionnaire";
import type { Guest, Player, Presence, Session, Teams } from "./types";

type Unsub = () => void;

/** Séances à venir, plus celles des 2 derniers jours. */
const fromDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return isoDate(d);
};
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const normalize = (id: string, d: Record<string, unknown>): Session =>
  ({ presence: {}, guests: {}, teams: null, ...d, id }) as Session;

/* ---------- Mode démo local (sans Firebase) ---------- */

type LocalData = { players: Record<string, Player>; sessions: Record<string, Session> };
const LS = "volley-local";
const listeners = new Set<() => void>();
// Repli en mémoire si le navigateur bloque le stockage (navigation privée…).
let memory: LocalData | null = null;
function load(): LocalData {
  if (memory) return structuredClone(memory);
  try { return JSON.parse(localStorage.getItem(LS) ?? "") as LocalData; } catch { return { players: {}, sessions: {} }; }
}
function mutate(fn: (d: LocalData) => void) {
  const d = load();
  fn(d);
  try { localStorage.setItem(LS, JSON.stringify(d)); } catch { memory = d; }
  listeners.forEach((l) => l());
}
function watch(fn: () => void): Unsub {
  fn();
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => e.key === LS && fn();
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}
export const LOCAL_UID = "local-me";

export function addDemoPlayers(n = 14) {
  mutate((d) => {
    for (const p of demoPlayers(n)) d.players[p.id] = p;
    // On les inscrit aussi à la prochaine séance pour pouvoir tester tout de suite.
    const next = Object.values(d.sessions).filter((s) => s.date >= isoDate(new Date())).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (next) for (const p of Object.values(d.players)) if (p.id.startsWith("demo-")) next.presence[p.id] = "yes";
  });
}
export function resetLocal() { mutate((d) => { d.players = {}; d.sessions = {}; }); }

/* ---------- API commune ---------- */

export function subscribePlayers(cb: (p: Record<string, Player>) => void): Unsub {
  if (!firebaseEnabled)
    return watch(() => cb(Object.fromEntries(Object.entries(load().players).map(([id, p]) => [id, normalizePlayer(p)]))));
  return onSnapshot(collection(db(), "players"), (snap) => {
    const r: Record<string, Player> = {};
    snap.forEach((d) => { r[d.id] = normalizePlayer({ ...(d.data() as Player), id: d.id }); });
    cb(r);
  }, (e) => console.error("players", e));
}

export async function savePlayer(p: Player) {
  if (!firebaseEnabled) return mutate((d) => { d.players[p.id] = p; });
  const { id, ...data } = p;
  await setDoc(doc(db(), "players", id), data);
}

export function subscribeSessions(cb: (s: Session[]) => void): Unsub {
  const from = fromDate();
  if (!firebaseEnabled)
    return watch(() => cb(Object.values(load().sessions).filter((s) => s.date >= from).sort(bySchedule)));
  const q = query(collection(db(), "sessions"), where("date", ">=", from), orderBy("date"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => normalize(d.id, d.data())).sort(bySchedule)),
    (e) => console.error("sessions", e));
}

export function subscribeSession(id: string, cb: (s: Session | null) => void): Unsub {
  if (!firebaseEnabled) return watch(() => cb(load().sessions[id] ?? null));
  return onSnapshot(doc(db(), "sessions", id), (d) => cb(d.exists() ? normalize(d.id, d.data()) : null),
    (e) => console.error("session", e));
}

const bySchedule = (a: Session, b: Session) => (a.date + a.time).localeCompare(b.date + b.time);

export async function createSession(s: Pick<Session, "date" | "time" | "place">, uid: string): Promise<string> {
  const data = { ...s, createdBy: uid, createdAt: Date.now(), presence: {}, guests: {}, teams: null };
  if (!firebaseEnabled) {
    const id = Math.random().toString(36).slice(2, 10);
    mutate((d) => { d.sessions[id] = { ...data, id }; });
    return id;
  }
  return (await addDoc(collection(db(), "sessions"), data)).id;
}

export async function deleteSession(id: string) {
  if (!firebaseEnabled) return mutate((d) => { delete d.sessions[id]; });
  await deleteDoc(doc(db(), "sessions", id));
}

export async function setPresence(sessionId: string, uid: string, p: Presence) {
  if (!firebaseEnabled) return mutate((d) => { d.sessions[sessionId].presence[uid] = p; });
  await updateDoc(doc(db(), "sessions", sessionId), { [`presence.${uid}`]: p });
}

export async function addGuest(sessionId: string, g: Guest) {
  if (!firebaseEnabled) return mutate((d) => { d.sessions[sessionId].guests[g.id] = g; });
  await updateDoc(doc(db(), "sessions", sessionId), { [`guests.${g.id}`]: g });
}

export async function removeGuest(sessionId: string, guestId: string) {
  if (!firebaseEnabled) return mutate((d) => { delete d.sessions[sessionId].guests[guestId]; });
  await updateDoc(doc(db(), "sessions", sessionId), { [`guests.${guestId}`]: deleteField() });
}

export async function saveTeams(sessionId: string, teams: Teams | null) {
  if (!firebaseEnabled) return mutate((d) => { d.sessions[sessionId].teams = teams; });
  await updateDoc(doc(db(), "sessions", sessionId), { teams });
}
