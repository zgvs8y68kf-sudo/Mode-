"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/AuthProvider";
import Empty from "@/components/Empty";
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

export default function ComptePage() {
  const { user, loading, enabled } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (!enabled)
    return <Empty title="Comptes non activés" text="Firebase n'est pas encore configuré : tes données sont enregistrées sur cet appareil uniquement." href="/profil" cta="Continuer sans compte" />;
  if (loading) return null;

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError(""); setInfo("");
    try { await fn(); router.push("/"); } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }

  if (user)
    return (
      <div className="card mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-3xl">Mon compte</h1>
        <p className="text-sm text-muted">Connecté·e en tant que <b className="text-ink">{user.email ?? user.displayName}</b>.<br />Ton dressing est synchronisé sur tous tes appareils.</p>
        <button className="btn-ghost" onClick={() => signOut(auth()).then(() => router.push("/"))}>Se déconnecter</button>
      </div>
    );

  return (
    <div className="card mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-3xl">{mode === "signup" ? "Créer mon compte" : "Me connecter"}</h1>
        <p className="mt-1 text-sm text-muted">Ton dressing, ton profil et tes analyses sauvegardés et synchronisés sur tous tes appareils.</p>
      </div>
      <button className="btn-ghost w-full" disabled={busy} onClick={() => run(() => signInWithPopup(auth(), new GoogleAuthProvider()))}>
        <span className="font-semibold">G</span> Continuer avec Google
      </button>
      <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" /></div>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        run(() => mode === "signup" ? createUserWithEmailAndPassword(auth(), email, password) : signInWithEmailAndPassword(auth(), email, password));
      }}>
        <input className="input" type="email" required autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn w-full" disabled={busy}>{busy ? "…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}</button>
      </form>
      {error && <p className="text-sm text-accent">{error}</p>}
      {info && <p className="text-sm text-muted">{info}</p>}
      <div className="flex justify-between text-xs text-muted">
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
  );
}
