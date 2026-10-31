"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { useProfile } from "@/lib/store";
import { SHOPS } from "@/lib/shops";
import { MORPHOLOGIES, type Profile, type Sex, type Undertone } from "@/lib/types";

const SKINS = ["#f6e1d3", "#efcfb6", "#e2b593", "#d29c78", "#bb7f5a", "#9a6243", "#7a4a31", "#5a3524", "#3e2419"];
const HAIRS = [
  { hex: "#1c1714", label: "noirs" }, { hex: "#3b2a20", label: "brun foncé" }, { hex: "#6b4a32", label: "châtains" },
  { hex: "#a4774a", label: "châtain clair" }, { hex: "#d8b77a", label: "blonds" }, { hex: "#a8462a", label: "roux" },
  { hex: "#9c9a96", label: "gris" }, { hex: "#e8e4dc", label: "blancs" },
];
const EYES = ["marron foncé", "marron", "noisette", "vert", "bleu-gris", "bleu", "gris"];
const GOALS = [
  "Minimaliste / intemporel", "Smart casual", "Streetwear", "Classique chic", "Workwear",
  "Romantique", "Rock / néo-goth", "Sport-chic", "Bohème", "Oser la couleur",
];

const DEFAULT: Profile = {
  name: "", sex: "homme", age: 30, heightCm: 175, morphology: "rectangle", skinHex: SKINS[3],
  undertone: "inconnu", eyeColor: "marron", hairHex: HAIRS[1].hex, hairLabel: HAIRS[1].label,
  styleGoals: [], budget: "moyen", city: "Paris", shops: ["uniqlo", "zalando"],
};

export default function ProfilPage() {
  const [saved, setSaved, ready] = useProfile();
  const [p, setP] = useState<Profile>(DEFAULT);
  const router = useRouter();

  useEffect(() => { if (saved) setP(saved); }, [saved]);
  const up = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const toggle = (k: "styleGoals" | "shops", v: string) =>
    up(k, p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v]);

  if (!ready) return null;

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="card flex flex-col items-center gap-2 self-start md:sticky md:top-20">
        <Avatar profile={p} size={220} />
        <p className="font-serif text-lg">{p.name || "Ton avatar"}</p>
        <p className="text-center text-xs text-muted">
          {p.sex}, {p.age} ans · {p.heightCm} cm<br />
          {MORPHOLOGIES[p.sex].find((m) => m.id === p.morphology)?.label}
        </p>
      </aside>

      <form
        className="space-y-6"
        onSubmit={(e) => { e.preventDefault(); setSaved({ ...p, colorSeason: saved?.colorSeason }); router.push(saved ? "/" : "/dressing"); }}
      >
        <div>
          <h1 className="text-3xl">{saved ? "Ton profil" : "Créons ton profil"}</h1>
          <p className="mt-1 text-sm text-muted">
            Ces infos restent sur ton appareil. Elles permettent à l&apos;IA d&apos;adapter coupes et couleurs à toi.
          </p>
        </div>

        <section className="card grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="label">Prénom</span>
            <input className="input" value={p.name} onChange={(e) => up("name", e.target.value)} placeholder="Thomas" />
          </label>
          <div className="sm:col-span-2"><span className="label">Je m&apos;habille plutôt au rayon</span>
            <div className="flex flex-wrap gap-2">
              {(["femme", "homme", "non-binaire"] as Sex[]).map((s) => (
                <button type="button" key={s} onClick={() => { up("sex", s); up("morphology", MORPHOLOGIES[s][0].id); }} className={`chip ${p.sex === s ? "chip-on" : ""}`}>
                  {s === "non-binaire" ? "mixte / non-binaire" : s}
                </button>
              ))}
            </div>
          </div>
          <label><span className="label">Âge</span>
            <input type="number" min={12} max={100} className="input" value={p.age} onChange={(e) => up("age", +e.target.value)} />
          </label>
          <label><span className="label">Taille (cm)</span>
            <input type="number" min={120} max={220} className="input" value={p.heightCm} onChange={(e) => up("heightCm", +e.target.value)} />
          </label>
        </section>

        <section className="card">
          <span className="label">Morphologie</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {MORPHOLOGIES[p.sex].map((m) => (
              <button type="button" key={m.id} onClick={() => up("morphology", m.id)}
                className={`rounded-xl border p-3 text-left text-sm transition ${p.morphology === m.id ? "border-ink bg-paper" : "border-line hover:border-ink"}`}>
                <span className="font-medium">{m.label}</span>
                <span className="block text-xs text-muted">{m.hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Pas sûr·e ? Choisis le plus proche : l&apos;IA raisonne en proportions, pas en cases rigides.</p>
        </section>

        <section className="card space-y-5">
          <div>
            <span className="label">Carnation</span>
            <div className="flex flex-wrap gap-2">
              {SKINS.map((s) => (
                <button type="button" key={s} onClick={() => up("skinHex", s)} aria-label={s}
                  className={`h-9 w-9 rounded-full border-2 ${p.skinHex === s ? "border-ink" : "border-transparent"}`} style={{ background: s }} />
              ))}
            </div>
          </div>
          <div>
            <span className="label">Sous-ton de peau</span>
            <div className="flex flex-wrap gap-2">
              {(["chaud", "froid", "neutre", "inconnu"] as Undertone[]).map((u) => (
                <button type="button" key={u} onClick={() => up("undertone", u)} className={`chip ${p.undertone === u ? "chip-on" : ""}`}>
                  {u === "inconnu" ? "je ne sais pas" : u}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Test rapide à la lumière du jour : veines plutôt vertes et l&apos;or te va mieux → chaud ; veines bleues/violettes et l&apos;argent te va mieux → froid ; les deux → neutre.
              Tu pourras aussi envoyer un selfie dans « Analyse ».
            </p>
          </div>
          <div>
            <span className="label">Cheveux (couleur naturelle ou actuelle)</span>
            <div className="flex flex-wrap gap-2">
              {HAIRS.map((h) => (
                <button type="button" key={h.hex} onClick={() => { up("hairHex", h.hex); up("hairLabel", h.label); }}
                  className={`chip flex items-center gap-2 ${p.hairHex === h.hex ? "chip-on" : ""}`}>
                  <span className="h-4 w-4 rounded-full border border-line" style={{ background: h.hex }} />{h.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Yeux</span>
            <div className="flex flex-wrap gap-2">
              {EYES.map((e) => (
                <button type="button" key={e} onClick={() => up("eyeColor", e)} className={`chip ${p.eyeColor === e ? "chip-on" : ""}`}>{e}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="card space-y-5">
          <div>
            <span className="label">Styles qui me tentent</span>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button type="button" key={g} onClick={() => toggle("styleGoals", g)} className={`chip ${p.styleGoals.includes(g) ? "chip-on" : ""}`}>{g}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Budget</span>
            <div className="flex gap-2">
              {(["petit", "moyen", "premium"] as const).map((b) => (
                <button type="button" key={b} onClick={() => up("budget", b)} className={`chip ${p.budget === b ? "chip-on" : ""}`}>{b}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Enseignes préférées</span>
            <div className="flex flex-wrap gap-2">
              {SHOPS.map((s) => (
                <button type="button" key={s.id} onClick={() => toggle("shops", s.id)} className={`chip ${p.shops.includes(s.id) ? "chip-on" : ""}`}>{s.name}</button>
              ))}
            </div>
          </div>
          <label className="block"><span className="label">Ville (pour la météo)</span>
            <input className="input" value={p.city} onChange={(e) => up("city", e.target.value)} />
          </label>
        </section>

        <button className="btn w-full sm:w-auto">{saved ? "Enregistrer" : "Continuer → numériser mon dressing"}</button>
      </form>
    </div>
  );
}
