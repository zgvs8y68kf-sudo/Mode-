import { POSTES, SKILL_QUESTIONS } from "@/lib/questionnaire";
import type { Poste, SkillKey } from "@/lib/types";

/** Fiche joueur façon jeu vidéo : note sur 99 et attributs de 1 à 5. */
export default function PlayerCard({ name, poste, age, rating, skills, current, large }: {
  name: string;
  poste: Poste | null;
  age: number | null;
  rating: number | null;
  skills: Partial<Record<SkillKey, number>>;
  current?: SkillKey;
  large?: boolean;
}) {
  const p = POSTES.find((x) => x.key === poste);
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border border-line bg-gradient-to-br from-panel-2 to-panel p-4">
      <div className={`flex flex-col items-center justify-center bg-gold text-bg ${large ? "w-28" : "w-22"}`}>
        <span className={`display leading-none ${large ? "text-7xl" : "text-5xl"}`}>{rating ?? "–"}</span>
        <span className="text-xs font-extrabold tracking-[0.14em]">NIVEAU</span>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div>
          <p className={`display truncate ${large ? "text-4xl" : "text-3xl"}`}>{name || "Ton nom"}</p>
          <p className="text-sm font-bold tracking-[0.1em] text-muted">
            {[p?.short, age !== null ? `${age} ANS` : null].filter(Boolean).join(" · ") || "POSTE · ÂGE"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-base font-bold">
          {SKILL_QUESTIONS.map((q) => {
            const v = skills[q.key];
            const on = current === q.key;
            return (
              <div key={q.key} className="flex flex-col gap-0.5">
                <span className={`flex justify-between ${on ? "text-gold" : v ? "text-ink" : "text-dim"}`}>
                  <span>{q.abbr}</span><span>{v ?? (on ? "?" : "–")}</span>
                </span>
                <span className="flex gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={`h-1 flex-1 ${v && i <= v ? (on ? "bg-gold" : "bg-ink") : "bg-line"}`} />
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
