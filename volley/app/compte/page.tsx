"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { auth } from "@/lib/firebase";

export default function ComptePage() {
  const { user, me } = useApp();
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="panel mx-auto max-w-md space-y-4 p-6 text-center">
      <h1 className="text-3xl">Mon compte</h1>
      <p className="text-lg text-muted">
        {me ? <>Salut <b className="text-ink">{me.name}</b> ! </> : null}
        Connecté·e avec <b className="text-ink">{user.email ?? user.displayName}</b>.
      </p>
      <button className="btn-ghost" onClick={() => signOut(auth()).then(() => router.push("/"))}>Se déconnecter</button>
    </div>
  );
}
