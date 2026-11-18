"use client";

import { useState } from "react";
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
  "auth/email-already-in-use": "Un compte existe déjà avec cet e-mail : connecte-toi.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/popup-closed-by-user": "Connexion annulée.",
  "auth/unauthorized-domain": "Domaine non autorisé : ajoute-le dans Firebase > Authentication > Settings > Authorized domains.",
};
const msg = (e: unknown) => (e instanceof FirebaseError ? MESSAGES[e.code] ?? e.message : String(e));

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError(""); setInfo("");
    try { await fn(); } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-4">
      <div>
        <span className="kicker">Volley · Équipes</span>
        <h1 className="mt-1 text-6xl">Fini les 15 minutes<br />pour faire<br /><span className="text-gold">les équipes</span></h1>
        <p className="mt-3 text-lg text-muted">Tu crées ton joueur une fois, puis tu dis juste si tu viens. L'app compose des équipes équilibrées.</p>
      </div>
      <div className="panel space-y-4 p-5">
        <button className="btn-ghost w-full" disabled={busy} onClick={() => run(() => signInWithPopup(auth(), new GoogleAuthProvider()))}>
          Continuer avec Google
        </button>
        <div className="flex items-center gap-3 text-sm uppercase tracking-widest text-dim"><span className="h-px flex-1 bg-line" />ou par e-mail<span className="h-px flex-1 bg-line" /></div>
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          run(() => mode === "signup" ? createUserWithEmailAndPassword(auth(), email, password) : signInWithEmailAndPassword(auth(), email, password));
        }}>
          <input className="input" type="email" required autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn w-full" disabled={busy}>{busy ? "…" : mode === "signup" ? "Créer mon compte" : "Me connecter"}</button>
        </form>
        {error && <p className="font-semibold text-red">{error}</p>}
        {info && <p className="text-muted">{info}</p>}
        <div className="flex justify-between text-base text-muted">
          <button className="underline" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}>
            {mode === "signup" ? "J'ai déjà un compte" : "Créer un compte"}
          </button>
          {mode === "login" && (
            <button className="underline" onClick={async () => {
              if (!email) return setError("Saisis ton e-mail d'abord.");
              try { await sendPasswordResetEmail(auth(), email); setInfo("E-mail de réinitialisation envoyé."); } catch (e) { setError(msg(e)); }
            }}>Mot de passe oublié</button>
          )}
        </div>
      </div>
    </div>
  );
}
