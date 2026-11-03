"use client";

import { useState } from "react";
import { usePhotoPicker } from "./usePhotoPicker";
import { apiFetch } from "@/lib/apiFetch";
import { compressImage } from "@/lib/image";
import { HAIRS, type Profile, type Sex, type Undertone } from "@/lib/types";

export interface BodyScanResult {
  usable: boolean;
  reason: string;
  sex: Sex;
  ageEstimate: number;
  morphology: string;
  proportions: string;
  legsVsTorso: string;
  skinHex: string;
  undertone: Exclude<Undertone, "inconnu">;
  hairLabel: string;
  hairHex: string;
  eyeColor: string;
  contrast: string;
  colorSeason: string;
  tips: string[];
}

/** Convertit le résultat de l'IA en champs de profil (que la personne peut ensuite corriger). */
export function scanToProfile(r: BodyScanResult): Partial<Profile> {
  const hair = HAIRS.find((h) => h.label === r.hairLabel);
  return {
    sex: r.sex,
    age: r.ageEstimate,
    morphology: r.morphology,
    skinHex: r.skinHex,
    undertone: r.undertone,
    hairLabel: r.hairLabel,
    hairHex: hair?.hex ?? r.hairHex,
    ...(r.eyeColor !== "non visible" ? { eyeColor: r.eyeColor } : {}),
    colorSeason: r.colorSeason,
  };
}

function PhotoSlot({ label, hint, value, onPick, capture }: { label: string; hint: string; value: string; onPick: (f: File) => void; capture: "user" | "environment" }) {
  const picker = usePhotoPicker((f) => onPick(f[0]), { capture });
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-paper p-3 text-center">
      <button type="button" onClick={picker.gallery} className="hover:opacity-80" aria-label={`${label} depuis la galerie`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-28 w-20 rounded-lg object-cover blur-[2px]" />
        ) : (
          <span className="grid h-28 w-20 place-items-center rounded-lg border border-line text-2xl text-muted">+</span>
        )}
      </button>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[11px] leading-tight text-muted">{hint}</span>
      <div className="flex gap-1.5">
        <button type="button" className="chip px-2.5 py-1 text-xs" onClick={picker.camera}>📷 Photo</button>
        <button type="button" className="chip px-2.5 py-1 text-xs" onClick={picker.gallery}>🖼️ Galerie</button>
      </div>
      {picker.inputs}
    </div>
  );
}

export default function BodyScan({ heightCm, onResult }: { heightCm: number; onResult: (r: BodyScanResult) => void }) {
  const [body, setBody] = useState("");
  const [face, setFace] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BodyScanResult | null>(null);

  async function analyse() {
    setLoading(true); setError(""); setResult(null);
    try {
      const r: BodyScanResult = await apiFetch("/api/body-profile", { body, face: face || undefined, heightCm });
      if (!r.usable) { setError(r.reason || "Photo inexploitable, essaie avec une autre photo."); return; }
      setResult(r);
      onResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      // Les photos ne sont jamais conservées : on les efface de la mémoire après l'analyse.
      setBody(""); setFace(""); setLoading(false);
    }
  }

  return (
    <section className="card space-y-4 border-accent/30">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Profil automatique</p>
        <h2 className="mt-1 text-2xl">Laisse l&apos;IA calculer ton profil</h2>
        <p className="mt-1 text-sm text-muted">
          Une photo en pied suffit pour estimer ta morphologie, ta carnation, ton sous-ton et ta saison colorimétrique. Ajoute un selfie pour affiner les yeux et les cheveux.
        </p>
      </div>

      <div className="flex gap-3">
        <PhotoSlot label="Photo en pied" hint="De face, bras légèrement écartés, en sous-vêtements ou tenue près du corps"
          value={body} capture="environment" onPick={async (f) => setBody(await compressImage(f, 1024, 0.8))} />
        <PhotoSlot label="Selfie (facultatif)" hint="Lumière du jour, sans maquillage ni filtre"
          value={face} capture="user" onPick={async (f) => setFace(await compressImage(f, 640))} />
      </div>

      <ul className="space-y-1 text-xs text-muted">
        <li>📸 Fond neutre, lumière naturelle, appareil à hauteur de poitrine, corps entier visible.</li>
        <li>🔒 Les photos ne sont <b className="text-ink">jamais enregistrées</b> (ni sur ton compte, ni sur nos serveurs) : elles sont envoyées une seule fois à l&apos;IA (Google Gemini) puis effacées.</li>
        <li>⚠️ Avec une clé Gemini gratuite, Google peut utiliser les contenus envoyés pour améliorer ses services. Une tenue près du corps (legging, t-shirt ajusté) donne de très bons résultats si tu préfères.</li>
      </ul>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>J&apos;ai 18 ans ou plus, c&apos;est une photo de moi et j&apos;accepte qu&apos;elle soit analysée par l&apos;IA.</span>
      </label>

      <button type="button" className="btn" disabled={!body || !consent || loading} onClick={analyse}>
        {loading ? "Analyse de ta silhouette…" : "Calculer mon profil ✦"}
      </button>
      {error && <p className="text-sm text-accent">{error}</p>}

      {result && (
        <div className="space-y-2 rounded-xl bg-paper p-4 text-sm">
          <p className="font-medium">✓ Profil calculé. Vérifie et ajuste les champs ci-dessous si besoin, puis enregistre.</p>
          <p className="text-muted">{result.proportions}</p>
          <p className="text-muted">
            Saison colorimétrique : <b className="text-ink">{result.colorSeason}</b> · contraste {result.contrast} · {result.legsVsTorso}
          </p>
          <ul className="list-disc pl-5 text-muted">{result.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
