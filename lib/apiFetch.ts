"use client";

import { auth, firebaseEnabled } from "./firebase";

/** fetch vers nos routes /api avec le jeton Firebase (protège la clé Gemini). */
export async function apiFetch(url: string, body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (firebaseEnabled) {
    const token = await auth().currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const r = await fetch(url, body === undefined ? { headers } : { method: "POST", headers, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({ error: `Erreur ${r.status}` }));
  if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
  return data;
}
