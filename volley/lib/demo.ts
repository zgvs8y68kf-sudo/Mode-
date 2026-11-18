import type { Player, Poste, SkillKey } from "./types";

const NAMES_F = ["Camille", "Léa", "Inès", "Manon", "Sarah", "Chloé", "Julie", "Emma", "Lucie", "Nora", "Zoé", "Anaïs", "Clara", "Mélanie", "Yasmine"];
const NAMES_M = ["Thomas", "Hugo", "Karim", "Lucas", "Maxime", "Antoine", "Julien", "Nicolas", "Paul", "Mehdi", "Romain", "Kevin", "Bastien", "Louis", "Olivier", "Théo"];
const SKILLS: SkillKey[] = ["service", "reception", "passe", "attaque", "bloc", "defense"];
const POSTES: Poste[] = ["polyvalent", "polyvalent", "passeur", "attaquant", "central", "libero"];

/** Joueurs fictifs pour essayer l'app (mode démo et tests). */
export function demoPlayers(n: number, rnd: () => number = Math.random): Player[] {
  const players: Player[] = [];
  for (let i = 0; i < n; i++) {
    const female = i % 5 < 2;
    const pool = female ? NAMES_F : NAMES_M;
    const base = 1 + Math.floor(rnd() * 5);
    const skills = Object.fromEntries(
      SKILLS.map((k) => [k, Math.min(5, Math.max(1, base + Math.round(rnd() * 2 - 1)))]),
    ) as Record<SkillKey, number>;
    players.push({
      id: `demo-${i}`,
      name: `${pool[i % pool.length]}${i >= pool.length ? " " + (Math.floor(i / pool.length) + 1) : ""}`,
      sex: female ? "F" : "M",
      birthYear: 1970 + Math.floor(rnd() * 37),
      skills,
      years: Math.min(3, Math.max(0, base - 2 + Math.round(rnd() - 0.5))),
      poste: POSTES[Math.floor(rnd() * POSTES.length)],
      v: 2,
      updatedAt: Date.now(),
    });
  }
  return players;
}
