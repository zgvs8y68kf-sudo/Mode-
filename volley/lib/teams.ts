import type { Member, SkillKey } from "./types";

const SKILLS: SkillKey[] = ["service", "reception", "passe", "attaque", "bloc", "defense"];

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const mean = (a: number[]) => (a.length ? sum(a) / a.length : NaN);
const range = (a: number[]) => {
  const v = a.filter((x) => !Number.isNaN(x));
  return v.length ? Math.max(...v) - Math.min(...v) : 0;
};

/** Nombre d'équipes conseillé : des équipes de 6 environ, au moins 2. */
export function suggestedTeamCount(n: number): number {
  if (n < 4) return 1;
  return Math.max(2, Math.round(n / 6));
}

export interface TeamStats {
  /** Niveau moyen sur 10 (converti en note sur 99 pour l'affichage). */
  level: number;
  women: number;
  men: number;
  age: number | null;
}

export function teamStats(team: Member[]): TeamStats {
  const ages = team.map((m) => m.age).filter((a): a is number => a !== null);
  return {
    level: mean(team.map((m) => m.level)) || 0,
    women: team.filter((m) => m.sex === "F").length,
    men: team.filter((m) => m.sex === "M").length,
    age: ages.length ? Math.round(mean(ages)) : null,
  };
}

/**
 * Plus le coût est bas, plus les équipes sont équilibrées. Dans l'ordre d'importance :
 * niveau moyen, répartition femmes/hommes, présence d'au moins un bon passeur et d'une
 * réception solide, équilibre de chaque geste, puis mélange des âges.
 */
export function cost(groups: Member[][]): number {
  const n = sum(groups.map((g) => g.length));
  const avgSize = n / groups.length;
  let c = 10 * range(groups.map((g) => mean(g.map((m) => m.level))));
  c += 4 * range(groups.map((g) => sum(g.map((m) => m.level)))) / avgSize;
  c += 3 * range(groups.map((g) => g.filter((m) => m.sex === "F").length));
  for (const k of SKILLS) c += 0.6 * range(groups.map((g) => mean(g.map((m) => m.skills[k]))));
  c += 1.5 * range(groups.map((g) => Math.max(...g.map((m) => m.skills.passe))));
  c += 1 * range(groups.map((g) => g.filter((m) => m.poste === "passeur").length));
  c += 0.08 * range(groups.map((g) => mean(g.map((m) => m.age).filter((a): a is number => a !== null))));
  return c;
}

function shuffle<T>(a: T[], rnd: () => number): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Répartition de départ : femmes puis hommes, distribués à tour de rôle. Tailles à ±1. */
function initial(members: Member[], k: number, rnd: () => number): Member[][] {
  const groups: Member[][] = Array.from({ length: k }, () => []);
  const ordered = [...shuffle(members.filter((m) => m.sex === "F"), rnd), ...shuffle(members.filter((m) => m.sex === "M"), rnd)];
  const start = Math.floor(rnd() * k);
  ordered.forEach((m, i) => groups[(i + start) % k].push(m));
  return groups;
}

/** Descente locale : on échange deux joueurs tant que ça améliore l'équilibre. */
function improve(groups: Member[][]): number {
  let best = cost(groups);
  let improved = true;
  while (improved) {
    improved = false;
    for (let a = 0; a < groups.length; a++)
      for (let b = a + 1; b < groups.length; b++)
        for (let i = 0; i < groups[a].length; i++)
          for (let j = 0; j < groups[b].length; j++) {
            const x = groups[a][i], y = groups[b][j];
            if (x.sex === y.sex && x.level === y.level && x.poste === y.poste) continue;
            groups[a][i] = y; groups[b][j] = x;
            const c = cost(groups);
            if (c < best - 1e-9) { best = c; improved = true; }
            else { groups[a][i] = x; groups[b][j] = y; }
          }
  }
  return best;
}

const key = (groups: Member[][]) => groups.map((g) => g.map((m) => m.id).sort().join(",")).sort().join("|");

/**
 * Compose k équipes équilibrées. Plusieurs départs aléatoires, puis on tire au hasard
 * parmi les meilleures solutions : relancer donne d'autres équipes, toutes équilibrées.
 */
export function makeTeams(members: Member[], k: number, rnd: () => number = Math.random): Member[][] {
  if (k <= 1 || members.length <= k) return k <= 1 ? [members] : members.map((m) => [m]);
  const restarts = members.length > 30 ? 12 : 24;
  const found = new Map<string, { groups: Member[][]; c: number }>();
  for (let r = 0; r < restarts; r++) {
    const g = initial(members, k, rnd);
    const c = improve(g);
    found.set(key(g), { groups: g.map((t) => [...t]), c });
  }
  const all = [...found.values()].sort((a, b) => a.c - b.c);
  const tolerance = all[0].c + 0.35;
  const pool = all.filter((s) => s.c <= tolerance);
  const pick = pool[Math.floor(rnd() * pool.length)];
  return pick.groups.map((t) => [...t].sort((a, b) => a.name.localeCompare(b.name, "fr")));
}
