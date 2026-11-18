import type { Guest, Member, Player, Poste, SkillKey } from "./types";

export interface Question {
  key: SkillKey;
  title: string;
  /** Abréviation façon fiche de joueur. */
  abbr: string;
  prompt: string;
  /** Une phrase courte par note, de 1 à 5. */
  levels: [string, string, string, string, string];
}

/** Une note de 1 à 5 par geste. On ne lit qu'une phrase courte, celle de la note choisie. */
export const SKILL_QUESTIONS: Question[] = [
  {
    key: "service", title: "Service", abbr: "SER", prompt: "C'est ton tour de servir.",
    levels: [
      "Je découvre, souvent par en dessous",
      "Il passe le filet une fois sur deux",
      "Il passe presque toujours",
      "Par-dessus, de façon régulière",
      "Je le place, flottant ou smashé",
    ],
  },
  {
    key: "reception", title: "Réception", abbr: "REC", prompt: "Le service adverse arrive sur toi.",
    levels: [
      "Je fais de mon mieux pour la toucher",
      "Je la remets en jeu",
      "Ça tient, la balle reste jouable",
      "Elle arrive souvent sur le passeur",
      "Précise, même sur un service difficile",
    ],
  },
  {
    key: "passe", title: "Passe", abbr: "PAS", prompt: "Une passe haute pour un coéquipier.",
    levels: [
      "Je découvre la passe à dix doigts",
      "Jouable quand la balle arrive bien",
      "Ça tient la plupart du temps",
      "Régulière vers l'attaquant",
      "Je distribue et je varie le jeu",
    ],
  },
  {
    key: "attaque", title: "Attaque", abbr: "ATT", prompt: "Une belle balle près du filet.",
    levels: [
      "Je la renvoie comme je peux",
      "Je frappe, sans trop d'élan",
      "Je smashe de temps en temps",
      "Course d'élan et vrai smash",
      "Je choisis ma zone : smash, feinte, placé",
    ],
  },
  {
    key: "bloc", title: "Contre", abbr: "CTR", prompt: "Un attaquant adverse face à toi au filet.",
    levels: [
      "Je ne monte pas encore au contre",
      "Je saute de temps en temps",
      "Je monte souvent et je gêne",
      "Je ferme une zone régulièrement",
      "Je lis l'attaque et je contre souvent",
    ],
  },
  {
    key: "defense", title: "Défense", abbr: "DEF", prompt: "L'adversaire attaque fort.",
    levels: [
      "La balle va trop vite pour moi",
      "Je la touche si elle arrive sur moi",
      "Je relève les balles faciles",
      "Bien placé·e, j'en relève pas mal",
      "J'anticipe et je plonge",
    ],
  },
];

export const ANCHORS = ["Je découvre", "Ça tient", "Solide"];

/** Profil express : une seule note pour tout le jeu. */
export const GLOBAL_LEVELS = [
  "Je découvre le volley",
  "Je joue pour le plaisir, j'ai les bases",
  "À l'aise sur tous les gestes simples",
  "Joueur·se régulier·e, technique solide",
  "Niveau club confirmé",
];

export const YEARS_ANSWERS = ["Moins d'1 an", "1 à 3 ans", "3 à 10 ans", "10 ans et +"];

export const POSTES: { key: Poste; label: string; short: string }[] = [
  { key: "polyvalent", label: "Un peu partout", short: "POLYVALENT" },
  { key: "passeur", label: "Passeur·se", short: "PASSEUR" },
  { key: "attaquant", label: "Attaque / réception", short: "ATTAQUANT" },
  { key: "central", label: "Central·e", short: "CENTRAL" },
  { key: "libero", label: "Libéro / défense", short: "LIBÉRO" },
];

export const GUEST_LEVELS = ["Débute", "Loisir", "À l'aise", "Régulier", "Club"];

const WEIGHTS: Record<SkillKey, number> = {
  service: 0.18, reception: 0.2, passe: 0.17, attaque: 0.2, bloc: 0.1, defense: 0.15,
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** Niveau interne sur 10 : 85 % gestes techniques, 15 % ancienneté. */
export function playerLevel(p: Pick<Player, "skills" | "years">): number {
  let s = 0;
  for (const k of Object.keys(WEIGHTS) as SkillKey[]) s += WEIGHTS[k] * (clamp(p.skills[k] ?? 1, 1, 5) - 1) / 4;
  return round1(10 * (0.85 * s + 0.15 * clamp(p.years ?? 0, 0, 3) / 3));
}

/** Note affichée façon jeu vidéo, de 40 à 99 : personne ne démarre à zéro. */
export const toRating = (level: number) => Math.round(40 + 5.9 * level);

export const allSkills = (n: number): Record<SkillKey, number> =>
  ({ service: n, reception: n, passe: n, attaque: n, bloc: n, defense: n });

/** Profils enregistrés avec l'ancien barème (1 à 4) : on les convertit en 1 à 5. */
export function normalizePlayer(p: Player & { play?: number }): Player {
  if (p.v === 2) return p;
  const map = [1, 1, 2, 4, 5];
  const skills = Object.fromEntries(Object.entries(p.skills ?? {}).map(([k, v]) => [k, map[clamp(v, 1, 4)]])) as Record<SkillKey, number>;
  const { play: _play, ...rest } = p;
  return { ...rest, skills, years: p.years ?? 0, v: 2 };
}

export const age = (birthYear: number, now = new Date()) => now.getFullYear() - birthYear;

export function playerToMember(p: Player): Member {
  return {
    id: p.id, name: p.name, sex: p.sex, age: p.birthYear ? age(p.birthYear) : null,
    level: playerLevel(p), skills: p.skills, poste: p.poste, guest: false,
  };
}

export function guestToMember(g: Guest): Member {
  const lvl = clamp(g.level, 1, 5);
  const skills = allSkills(lvl);
  return {
    id: `guest:${g.id}`, name: g.name, sex: g.sex, age: null,
    level: playerLevel({ skills, years: clamp(lvl - 2, 0, 3) }), skills, poste: "polyvalent", guest: true,
  };
}
