"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { PLAY_ANSWERS, POSTES, SKILL_QUESTIONS, YEARS_ANSWERS, age, strengths } from "@/lib/questionnaire";
import { savePlayer } from "@/lib/store";
import type { Player, Poste, Sex, SkillKey } from "@/lib/types";

type Draft = {
  name: string;
  sex: Sex | null;
  birthYear: string;
  skills: Partial<Record<SkillKey, number>>;
  years: number | null;
  play: number | null;
  poste: Poste | null;
};

const fromPlayer = (p: Player | null, fallbackName = ""): Draft => ({
  name: p?.name ?? fallbackName,
  sex: p?.sex ?? null,
  birthYear: p?.birthYear ? String(p.birthYear) : "",
  skills: p?.skills ?? {},
  years: p?.years ?? null,
  play: p?.play ?? null,
  poste: p?.poste ?? null,
});

// Étapes : identité, 6 gestes, expérience, poste.
const STEPS = 1 + SKILL_QUESTIONS.length + 2;
const thisYear = new Date().getFullYear();

export default function ProfilPage() {
  const { uid, me, user, playersLoaded } = useApp();
  const [editing, setEditing] = useState(false);
  if (!uid || !playersLoaded) return <p className="pt-10 text-center text-sm text-muted">Chargement…</p>;
  if (me && !editing) return <Summary me={me} onEdit={() => setEditing(true)} />;
  return <Questionnaire uid={uid} initial={fromPlayer(me, user?.displayName?.split(" ")[0] ?? "")} first={!me} onDone={() => setEditing(false)} />;
}

function Questionnaire({ uid, initial, first, onDone }: { uid: string; initial: Draft; first: boolean; onDone: () => void }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const year = Number(d.birthYear);
  const identityOk = d.name.trim().length > 0 && d.sex && year >= thisYear - 90 && year <= thisYear - 8;
  const complete = identityOk && SKILL_QUESTIONS.every((q) => d.skills[q.key]) && d.years !== null && d.play !== null && d.poste;

  async function save() {
    if (!complete) return;
    setSaving(true); setError("");
    try {
      await savePlayer({
        id: uid, name: d.name.trim().slice(0, 40), sex: d.sex!, birthYear: year,
        skills: d.skills as Record<SkillKey, number>, years: d.years!, play: d.play!, poste: d.poste!, updatedAt: Date.now(),
      });
      onDone();
      if (first) router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  const skill = step >= 1 && step <= SKILL_QUESTIONS.length ? SKILL_QUESTIONS[step - 1] : null;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
          <span>{first ? "Ton profil de joueur·se" : "Modifier mon profil"}</span>
          <span>{step + 1} / {STEPS}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
        <div className="card space-y-5">
          <div>
            <h1 className="text-2xl">{first ? "Bienvenue dans l'équipe 👋" : "Qui es-tu ?"}</h1>
            <p className="mt-1.5 text-sm text-muted">
              2 minutes, une seule fois. Il n'y a pas de bonne ou de mauvaise réponse : ça sert uniquement à faire des
              équipes équilibrées. Le détail de tes réponses n'est jamais affiché aux autres.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="name">Prénom (ou surnom)</label>
            <input id="name" className="input" maxLength={40} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex. Camille" />
          </div>
          <div>
            <span className="label">Tu joues avec les</span>
            <div className="grid grid-cols-2 gap-2">
              {([["F", "Femmes"], ["M", "Hommes"]] as const).map(([k, l]) => (
                <button key={k} className={`option text-center ${d.sex === k ? "option-on" : ""}`} onClick={() => set({ sex: k })}>{l}</button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">Pour répartir équitablement les filles et les garçons dans les équipes mixtes.</p>
          </div>
          <div>
            <label className="label" htmlFor="year">Année de naissance</label>
            <input id="year" className="input" inputMode="numeric" maxLength={4} value={d.birthYear}
              onChange={(e) => set({ birthYear: e.target.value.replace(/\D/g, "") })} placeholder="Ex. 1992" />
            <p className="mt-1.5 text-xs text-muted">L'âge sert à mélanger les générations, pas à te noter.</p>
          </div>
          <button className="btn-accent w-full py-3" disabled={!identityOk} onClick={next}>C'est parti</button>
        </div>
      )}

      {skill && (
        <div className="card space-y-4">
          <div>
            <p className="text-sm font-semibold text-accent">{skill.emoji} {skill.title}</p>
            <h2 className="mt-1 text-xl">{skill.question}</h2>
          </div>
          <div className="space-y-2">
            {skill.answers.map((a, i) => (
              <button key={i} className={`option ${d.skills[skill.key] === i + 1 ? "option-on" : ""}`}
                onClick={() => { set({ skills: { ...d.skills, [skill.key]: i + 1 } }); setTimeout(next, 180); }}>
                {a}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">Réponds pour un jour « normal », ni ton meilleur match ni ton pire 🙂</p>
        </div>
      )}

      {step === SKILL_QUESTIONS.length + 1 && (
        <div className="card space-y-5">
          <h2 className="text-xl">Et ton parcours ?</h2>
          <div>
            <span className="label">Tu joues au volley depuis</span>
            <div className="grid grid-cols-2 gap-2">
              {YEARS_ANSWERS.map((a, i) => (
                <button key={i} className={`option text-center text-sm ${d.years === i ? "option-on" : ""}`} onClick={() => set({ years: i })}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Tu as surtout joué</span>
            <div className="space-y-2">
              {PLAY_ANSWERS.map((a, i) => (
                <button key={i} className={`option text-sm ${d.play === i ? "option-on" : ""}`} onClick={() => set({ play: i })}>{a}</button>
              ))}
            </div>
          </div>
          <button className="btn-accent w-full py-3" disabled={d.years === null || d.play === null} onClick={next}>Continuer</button>
        </div>
      )}

      {step === SKILL_QUESTIONS.length + 2 && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-xl">Où te sens-tu le mieux sur le terrain ?</h2>
            <p className="mt-1 text-sm text-muted">On s'en sert pour que chaque équipe ait si possible quelqu'un à la passe.</p>
          </div>
          <div className="space-y-2">
            {POSTES.map((p) => (
              <button key={p.key} className={`option ${d.poste === p.key ? "option-on" : ""}`} onClick={() => set({ poste: p.key })}>
                <span className="font-semibold">{p.label}</span>
                <span className="block text-xs text-muted">{p.hint}</span>
              </button>
            ))}
          </div>
          <button className="btn-accent w-full py-3" disabled={!complete || saving} onClick={save}>
            {saving ? "Enregistrement…" : "Enregistrer mon profil"}
          </button>
          {!complete && d.poste && <p className="text-xs text-accent">Il manque une réponse plus haut : reviens en arrière pour la compléter.</p>}
          {error && <p className="text-sm text-accent">{error}</p>}
        </div>
      )}

      <div className="flex justify-between">
        <button className="btn-ghost" disabled={step === 0} onClick={back}>← Retour</button>
        {!first && <button className="btn-ghost" onClick={onDone}>Annuler</button>}
        {skill && d.skills[skill.key] && <button className="btn-ghost" onClick={next}>Suivant →</button>}
      </div>
    </div>
  );
}

function Summary({ me, onEdit }: { me: Player; onEdit: () => void }) {
  const poste = POSTES.find((p) => p.key === me.poste);
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="card flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-2xl font-extrabold text-white">
          {me.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl">{me.name}</h1>
          <p className="text-sm text-muted">{age(me.birthYear)} ans · {poste?.label} · {YEARS_ANSWERS[me.years].toLowerCase()} de volley</p>
        </div>
      </div>
      <div className="card space-y-4">
        <div>
          <h2 className="text-lg">Ton jeu</h2>
          <p className="text-sm text-muted">Point{strengths(me).length > 1 ? "s" : ""} fort{strengths(me).length > 1 ? "s" : ""} : <b className="text-ink">{strengths(me).join(", ")}</b></p>
        </div>
        {SKILL_QUESTIONS.map((q) => (
          <div key={q.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold">{q.emoji} {q.title}</span>
              <span className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-2 w-6 rounded-full ${i <= me.skills[q.key] ? "bg-accent" : "bg-line"}`} />
                ))}
              </span>
            </div>
            <p className="text-xs text-muted">{q.answers[me.skills[q.key] - 1]}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted">Tu as progressé ? Mets ton profil à jour quand tu veux.</p>
      <div className="text-center"><button className="btn" onClick={onEdit}>Modifier mes réponses</button></div>
    </div>
  );
}
