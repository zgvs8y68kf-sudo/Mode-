"use client";

import Link from "next/link";
import { firebaseEnabled } from "@/lib/firebase";

export default function Landing() {
  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 py-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Ton styliste IA</p>
          <h1 className="mt-3 text-5xl leading-[1.05] sm:text-6xl">Bien s&apos;habiller,<br />sans se prendre la tête.</h1>
          <p className="mt-4 max-w-md text-muted">
            Numérise ta garde-robe en photo. Chaque matin, reçois la tenue complète qui va avec la météo, ton programme,
            ta morphologie et tes couleurs. Et découvre la pièce qui manque vraiment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
              <Link href={firebaseEnabled ? "/compte" : "/profil"} className="btn">Créer mon compte — 2 min</Link>
              {firebaseEnabled && <Link href="/compte" className="btn-ghost">J&apos;ai déjà un compte</Link>}
            </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["1", "Ton profil", "Morphologie, carnation, style"], ["2", "Ton dressing", "Une photo par pièce, l'IA fait le reste"], ["3", "Ta tenue", "Météo + occasion = la bonne tenue"]].map(([n, t, d]) => (
            <div key={n} className="card p-4">
              <p className="font-serif text-3xl text-accent">{n}</p>
              <p className="mt-2 text-sm font-medium">{t}</p>
              <p className="text-xs text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
