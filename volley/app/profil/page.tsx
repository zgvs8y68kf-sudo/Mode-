"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import PlayerCard from "@/components/PlayerCard";
import {
  ANCHORS, GLOBAL_LEVELS, POSTES, SKILL_QUESTIONS, YEARS_ANSWERS, age, allSkills, playerLevel, toRating,
} from "@/lib/questionnaire";
import { savePlayer } from "@/lib/store";
import type { Player, Poste, Sex, SkillKey } from "@/lib/types";

type Draft = {
  name: string;
  sex: Sex | null;
  birthYear: string;
  skills: Partial<Record<SkillKey, number>>;
  global: number | null;
  years: number | null;
  poste: Poste | null;
};

const fromPlayer = (p: Player | null, fallbackName = ""): Draft => ({
  name: p?.name ?? fallbackName,
  sex: p?.sex ?? null,
  birthYear: p?.birthYear ? String(p.birthYear) : "",
  skills: p && !p.express ? p.skills : {},
  global: p?.express ? p.skills.service : null,
  years: p?.years ?? null,
  poste: p?.poste ?? null,
});

const thisYear = new Date().getFullYear();

export default function ProfilPage() {
  const { uid, me, user, playersLoaded } = useApp();
  const [editing, setEditing] = useState(false);
  if (!uid || !playersLoaded) return <p className="display pt-10 text-center text-xl text-dim">Chargement…</p>;
  if (me && !editing) return <Summary me={me} onEdit={() => setEditing(true)} />;
  return (
    <Builder uid={uid} initial={fromPlayer(me, user?.displayName?.split(" ")[0] ?? "")} first={!me}
      express={!!me?.express} onDone={() => setEditing(false)} />
  );
}

/** Barres montantes de 1 à 5, comme une jauge d'attribut. */
function Scale({ value, onPick, label }: { value: number | undefined | null; onPick: (n: number) => void; label: string }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 items-end gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={value === n} onClick={() => onPick(n)}
            style={{ height: 44 + (n - 1) * 12 }}
            className={`display text-2xl transition ${value === n ? "bg-gold text-bg text-3xl" : "bg-panel-2 text-ink hover:bg-line"}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-base font-bold text-dim">
        {ANCHORS.map((a) => <span key={a}>{a}</span>)}
      </div>
    </div>
  );
}

function Builder({ uid, initial, first, express: startExpress, onDone }: {
  uid: string; initial: Draft; first: boolean; express: boolean; onDone: () => void;
}) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial);
  const [express, setExpress] = useState(startExpress);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  // Complet : identité, 6 gestes, parcours. Express : identité, note globale, parcours.
  const total = express ? 3 : 2 + SKILL_QUESTIONS.length;
  const last = total - 1;
  const next = () => setStep((s) => Math.min(last, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const year = Number(d.birthYear);
  const identityOk = d.name.trim().length > 0 && !!d.sex && year >= thisYear - 90 && year <= thisYear - 8;
  const skills: Partial<Record<SkillKey, number>> = express ? (d.global ? allSkills(d.global) : {}) : d.skills;
  const skillsDone = SKILL_QUESTIONS.every((q) => skills[q.key]);
  const complete = identityOk && skillsDone && d.years !== null && !!d.poste;
  const rating = skillsDone && d.years !== null ? toRating(playerLevel({ skills: skills as Record<SkillKey, number>, years: d.years })) : null;

  async function save() {
    if (!complete) return;
    setSaving(true); setError("");
    try {
      await savePlayer({
        id: uid, name: d.name.trim().slice(0, 40), sex: d.sex!, birthYear: year,
        skills: skills as Record<SkillKey, number>, years: d.years!, poste: d.poste!, express, v: 2, updatedAt: Date.now(),
      });
      onDone();
      if (first) router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  const skill = !express && step >= 1 && step <= SKILL_QUESTIONS.length ? SKILL_QUESTIONS[step - 1] : null;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <span className="display text-2xl">{first ? "Crée ton joueur" : "Modifie ton joueur"}</span>
        <span className="display text-xl text-gold">{step + 1} / {total}</span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 flex-1 ${i <= step ? "bg-red" : "bg-line"}`} />)}
      </div>

      {step > 0 && (
        <PlayerCard name={d.name} poste={d.poste} age={year ? thisYear - year : null} rating={rating}
          skills={skills} current={skill?.key} />
      )}

      {step === 0 && (
        <div className="space-y-5">
          <div>
            <span className="kicker">{first ? "Bienvenue dans l'équipe" : "Ton identité"}</span>
            <h1 className="mt-1 text-5xl">Qui es-tu ?</h1>
            <p className="mt-2 text-lg text-muted">
              Ça sert seulement à faire des équipes équilibrées. Ta fiche n'est visible que par toi :
              les autres voient juste le niveau moyen des équipes.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="name">Prénom ou surnom</label>
            <input id="name" className="input" maxLength={40} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex. Camille" />
          </div>
          <div>
            <span className="label">Tu joues avec les</span>
            <div className="grid grid-cols-2 gap-2">
              {([["F", "Femmes"], ["M", "Hommes"]] as const).map(([k, l]) => (
                <button key={k} className={`option text-center ${d.sex === k ? "option-on" : ""}`} onClick={() => set({ sex: k })}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="year">Année de naissance</label>
            <input id="year" className="input" inputMode="numeric" maxLength={4} value={d.birthYear}
              onChange={(e) => set({ birthYear: e.target.value.replace(/\D/g, "") })} placeholder="Ex. 1992" />
            <p className="mt-1.5 text-base text-dim">L'âge sert à mélanger les générations, pas à te noter.</p>
          </div>
          <div className="grid gap-2 pt-1">
            <button className="btn w-full" disabled={!identityOk} onClick={() => { setExpress(false); setStep(1); }}>
              Fiche complète · 1 min
            </button>
            <button className="btn-ghost w-full" disabled={!identityOk} onClick={() => { setExpress(true); setStep(1); }}>
              Profil express · 20 s
            </button>
            <p className="text-center text-base text-dim">Express : une seule note pour tout ton jeu. Pratique si tu joues depuis longtemps.</p>
          </div>
        </div>
      )}

      {skill && (
        <div className="space-y-4">
          <div>
            <span className="kicker text-red">Attribut {step} · {skill.abbr}</span>
            <h1 className="mt-1 text-6xl">{skill.title}</h1>
            <p className="mt-1 text-xl text-muted">{skill.prompt}</p>
          </div>
          <Scale label={skill.title} value={d.skills[skill.key]}
            onPick={(n) => { set({ skills: { ...d.skills, [skill.key]: n } }); setTimeout(next, 220); }} />
          {d.skills[skill.key] && (
            <p className="border-l-4 border-gold bg-panel px-3 py-2.5 text-lg">
              <b className="text-gold">{d.skills[skill.key]} · </b>{skill.levels[d.skills[skill.key]! - 1]}
            </p>
          )}
        </div>
      )}

      {express && step === 1 && (
        <div className="space-y-4">
          <div>
            <span className="kicker text-red">Profil express</span>
            <h1 className="mt-1 text-6xl">Ton niveau</h1>
            <p className="mt-1 text-xl text-muted">En général, sur l'ensemble du jeu.</p>
          </div>
          <Scale label="Niveau général" value={d.global} onPick={(n) => { set({ global: n }); setTimeout(next, 220); }} />
          {d.global && (
            <p className="border-l-4 border-gold bg-panel px-3 py-2.5 text-lg">
              <b className="text-gold">{d.global} · </b>{GLOBAL_LEVELS[d.global - 1]}
            </p>
          )}
        </div>
      )}

      {step === last && (
        <div className="space-y-5">
          <div>
            <span className="kicker text-red">Dernière étape</span>
            <h1 className="mt-1 text-5xl">Ton parcours</h1>
          </div>
          <div>
            <span className="label">Tu joues depuis</span>
            <div className="grid grid-cols-2 gap-2">
              {YEARS_ANSWERS.map((a, i) => (
                <button key={a} className={`option text-center ${d.years === i ? "option-on" : ""}`} onClick={() => set({ years: i })}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Ton poste préféré</span>
            <div className="flex flex-wrap gap-2">
              {POSTES.map((p) => (
                <button key={p.key} className={`chip ${d.poste === p.key ? "chip-on" : ""}`} onClick={() => set({ poste: p.key })}>{p.label}</button>
              ))}
            </div>
            <p className="mt-1.5 text-base text-dim">Pour mettre si possible quelqu'un à la passe dans chaque équipe.</p>
          </div>
          <button className="btn-gold w-full" disabled={!complete || saving} onClick={save}>
            {saving ? "Enregistrement…" : rating ? `Valider mon joueur · ${rating}` : "Valider mon joueur"}
          </button>
          {!complete && d.poste && d.years !== null && <p className="text-red">Il manque une réponse : reviens en arrière pour la compléter.</p>}
          {error && <p className="text-red">{error}</p>}
        </div>
      )}

      <div className="flex justify-between gap-2 pt-2">
        <button className="btn-ghost" disabled={step === 0} onClick={back}>← Retour</button>
        {!first && <button className="btn-ghost" onClick={onDone}>Annuler</button>}
        {(skill ? d.skills[skill.key] : express && step === 1 ? d.global : false) && (
          <button className="btn-ghost" onClick={next}>Suivant →</button>
        )}
      </div>
    </div>
  );
}

function Summary({ me, onEdit }: { me: Player; onEdit: () => void }) {
  const rating = toRating(playerLevel(me));
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <span className="kicker">Mon joueur</span>
        <h1 className="mt-1 text-5xl">Ta fiche</h1>
      </div>
      <PlayerCard large name={me.name} poste={me.poste} age={age(me.birthYear)} rating={rating} skills={me.skills} />
      <p className="text-base text-dim">Visible par toi seul·e. Les autres voient uniquement le niveau moyen des équipes.</p>
      {me.express ? (
        <div className="panel p-4">
          <p className="display text-xl text-gold">Profil express · {me.skills.service}/5</p>
          <p className="text-lg text-muted">{GLOBAL_LEVELS[me.skills.service - 1]}</p>
          <p className="mt-2 text-base text-dim">Passe en fiche complète pour des équipes encore plus justes.</p>
        </div>
      ) : (
        <div className="panel divide-y divide-line">
          {SKILL_QUESTIONS.map((q) => (
            <div key={q.key} className="flex items-baseline gap-3 px-4 py-2.5">
              <span className="display w-10 text-lg text-gold">{q.abbr}</span>
              <span className="display w-6 text-lg">{me.skills[q.key]}</span>
              <span className="text-lg text-muted">{q.levels[me.skills[q.key] - 1]}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-center text-base text-dim">Tu as progressé ? Mets ta fiche à jour quand tu veux.</p>
      <button className="btn w-full" onClick={onEdit}>Modifier mon joueur</button>
    </div>
  );
}
