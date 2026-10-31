"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/store";

type Trends = { text: string; sources: { url: string; title: string }[] };

// Synthèse de la recherche initiale (oct. 2026), recoupée sur plusieurs sources — voir docs/CONCEPT.md.
const BASELINE = [
  { t: "Tailoring & power dressing", d: "Le costume revient : tailleur-jupe, blazers structurés, taille marquée ; chez l'homme, coupes un peu plus ajustées et classiques revisités (manteau Chesterfield, croisé, col roulé)." },
  { t: "Superposition (layering)", d: "Superpositions réfléchies : pull sans manches, chemise, maille, manteau statement." },
  { t: "Carreaux & tartan", d: "Le motif à carreaux, version grunge assagie, est partout en homme comme en femme." },
  { t: "Texture & matières riches", d: "Velours, fausse fourrure, effet croco, maille épaisse : la matière fait la tenue." },
  { t: "Bordeaux & chocolat", d: "Le bordeaux et le marron chocolat deviennent des neutres ; associés à rose poudré, bleu, crème ou caramel." },
  { t: "Denim large", d: "Wide-leg et barrel restent la base ; le slim revient surtout sur les podiums, de façon marginale en boutique." },
  { t: "Couleur de l'année : Cloud Dancer", d: "Pantone 2026 est un blanc cassé doux : parfait en base, en total look clair ou en maille." },
];

export default function TendancesPage() {
  const [profile] = useProfile();
  const [data, setData] = useState<Trends | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/trends?sex=${profile?.sex ?? "mixte"}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setData(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (profile !== undefined) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.sex]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Tendances du moment</h1>
        <p className="text-sm text-muted">Mises à jour en direct par l&apos;IA via la recherche web, en ne gardant que ce que plusieurs médias reconnus confirment.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {BASELINE.map((b) => (
          <div key={b.t} className="card p-4"><p className="font-serif text-lg">{b.t}</p><p className="text-sm text-muted">{b.d}</p></div>
        ))}
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className="label">Veille IA du jour</span>
          <button className="btn-ghost" onClick={load} disabled={loading}>{loading ? "Recherche…" : "Actualiser"}</button>
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        {data && (
          <>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.text.replace(/\*\*/g, "")}</div>
            {data.sources.length > 0 && (
              <div>
                <span className="label">Sources</span>
                <ul className="space-y-1 text-xs">
                  {data.sources.map((s) => (
                    <li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
