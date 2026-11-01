"use client";

import { useRef, useState } from "react";
import ColorWheel from "@/components/ColorWheel";
import Empty from "@/components/Empty";
import ItemThumb from "@/components/ItemThumb";
import MissingCard from "@/components/MissingCard";
import { compressImage } from "@/lib/image";
import { useAudit, useItems, useProfile, wardrobeForAI } from "@/lib/store";
import { apiFetch } from "@/lib/apiFetch";
import { CATEGORIES, type ItemColor, type MissingPiece } from "@/lib/types";

interface Audit {
  colorSeason: string;
  colorSeasonWhy: string;
  bestColors: ItemColor[];
  avoidColors: ItemColor[];
  morphologyTips: string[];
  styleDirections: { name: string; description: string; fromWardrobe: string[] }[];
  strengths: string[];
  weaknesses: string[];
  missingPieces: MissingPiece[];
  underused?: string[];
  at?: string;
}

export default function AnalysePage() {
  const [profile, setProfile, ready] = useProfile();
  const [items] = useItems();
  const [audit, setAudit] = useAudit<Audit>();
  const [selfie, setSelfie] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);


  async function run() {
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/api/audit", { profile, wardrobe: wardrobeForAI(items), selfie: selfie || undefined });
      const a = { ...data, at: new Date().toISOString() };
      setAudit(a);
      if (profile) setProfile({ ...profile, colorSeason: a.colorSeason });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;
  if (!profile) return <Empty title="Profil requis" text="L'analyse s'appuie sur ta morphologie et ta carnation." href="/profil" cta="Créer mon profil" />;

  const byId = new Map(items.map((i) => [i.id, i]));
  const allColors = items.flatMap((i) => i.colors.map((c) => c.hex));
  const max = Math.max(1, ...CATEGORIES.map((c) => items.filter((i) => i.category === c).length));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Analyse de ton style</h1>
        <p className="text-sm text-muted">Colorimétrie, coupes, directions de style et pièces manquantes — basées sur ton profil, ton dressing et les tendances du moment.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <span className="label">Ton dressing sur la roue des couleurs</span>
          <ColorWheel colors={allColors} palette={audit?.bestColors.map((c) => c.hex)} />
        </div>
        <div className="card space-y-3">
          <span className="label">Équilibre par catégorie</span>
          {CATEGORIES.map((c) => {
            const n = items.filter((i) => i.category === c).length;
            return (
              <div key={c} className="flex items-center gap-3 text-sm">
                <span className="w-24 capitalize">{c}</span>
                <div className="h-2 flex-1 rounded-full bg-paper"><div className="h-2 rounded-full bg-ink" style={{ width: `${(n / max) * 100}%` }} /></div>
                <span className="w-6 text-right text-muted">{n}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card flex flex-wrap items-center gap-4">
        <div className="flex-1">
          <p className="font-medium">Affiner la colorimétrie avec un selfie (facultatif)</p>
          <p className="text-xs text-muted">Lumière du jour, sans maquillage ni filtre, cheveux visibles. La photo est envoyée à l&apos;IA pour l&apos;analyse puis n&apos;est pas conservée.</p>
        </div>
        {selfie && /* eslint-disable-next-line @next/next/no-img-element */ <img src={selfie} alt="selfie" className="h-14 w-14 rounded-full object-cover" />}
        <button className="btn-ghost" onClick={() => input.current?.click()}>{selfie ? "Changer" : "Ajouter un selfie"}</button>
        <input ref={input} type="file" accept="image/*" capture="user" hidden
          onChange={async (e) => e.target.files?.[0] && setSelfie(await compressImage(e.target.files[0], 512))} />
        <button className="btn" disabled={loading || items.length === 0} onClick={run}>
          {loading ? "Analyse en cours…" : audit ? "Relancer l'analyse" : "Lancer l'analyse"}
        </button>
        {items.length === 0 && <p className="w-full text-xs text-accent">Ajoute d&apos;abord quelques pièces à ton dressing.</p>}
        {error && <p className="w-full text-sm text-accent">{error}</p>}
      </section>

      {audit && (
        <>
          <section className="card space-y-4">
            <div>
              <span className="label">Ta saison colorimétrique</span>
              <h2 className="text-3xl">{audit.colorSeason}</h2>
              <p className="mt-1 text-sm text-muted">{audit.colorSeasonWhy}</p>
            </div>
            <div>
              <span className="label">Tes meilleures couleurs (près du visage)</span>
              <div className="flex flex-wrap gap-3">
                {audit.bestColors.map((c) => (
                  <div key={c.hex} className="text-center"><div className="h-12 w-12 rounded-full border border-line" style={{ background: c.hex }} /><p className="mt-1 w-14 text-[11px] leading-tight">{c.name}</p></div>
                ))}
              </div>
            </div>
            <div>
              <span className="label">À porter plutôt loin du visage</span>
              <div className="flex flex-wrap gap-3">
                {audit.avoidColors.map((c) => (
                  <div key={c.hex} className="text-center opacity-80"><div className="h-9 w-9 rounded-full border border-line" style={{ background: c.hex }} /><p className="mt-1 w-14 text-[11px] leading-tight">{c.name}</p></div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="card">
              <span className="label">Coupes qui te mettent en valeur</span>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">{audit.morphologyTips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
            <div className="card space-y-3">
              <div><span className="label">Forces du dressing</span><ul className="list-disc space-y-1 pl-5 text-sm">{audit.strengths.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
              <div><span className="label">À améliorer</span><ul className="list-disc space-y-1 pl-5 text-sm">{audit.weaknesses.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl">Styles qui pourraient t&apos;aller</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {audit.styleDirections.map((s) => (
                <div key={s.name} className="card space-y-2">
                  <h3 className="text-xl">{s.name}</h3>
                  <p className="text-sm text-muted">{s.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.fromWardrobe.map((id) => byId.get(id)).filter((x) => !!x).map((i) => <ItemThumb key={i.id} item={i} size="sm" />)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl">Les pièces qui manquent</h2>
            <p className="text-sm text-muted">Classées par impact : chaque pièce débloque plusieurs nouvelles tenues avec ce que tu as déjà.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {audit.missingPieces.map((m, i) => <MissingCard key={i} piece={m} preferred={profile.shops} budget={profile.budget} />)}
            </div>
          </section>
          {audit.at && <p className="text-xs text-muted">Analyse du {new Date(audit.at).toLocaleDateString("fr-FR")}</p>}
        </>
      )}
    </div>
  );
}
