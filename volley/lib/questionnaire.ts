import type { Guest, Member, Player, Poste, SkillKey } from "./types";

export interface Question {
  key: SkillKey;
  title: string;
  emoji: string;
  question: string;
  answers: [string, string, string, string];
}

/** Une question par geste, avec des réponses décrites en situation plutôt qu'une note à s'attribuer. */
export const SKILL_QUESTIONS: Question[] = [
  {
    key: "service", title: "Service", emoji: "🎯",
    question: "Quand c'est ton tour de servir…",
    answers: [
      "Je sers par en dessous, et je suis en train d'apprendre",
      "Mon service passe le filet la plupart du temps",
      "Je sers par-dessus de façon assez régulière",
      "Je choisis où envoyer mon service (flottant, smashé…)",
    ],
  },
  {
    key: "reception", title: "Réception", emoji: "🙌",
    question: "Quand le service adverse arrive sur toi…",
    answers: [
      "Je fais de mon mieux pour toucher le ballon",
      "Je le remets en jeu, même s'il part un peu n'importe où",
      "Je l'envoie souvent vers la zone du passeur",
      "Je le pose précisément au passeur, même sur un service difficile",
    ],
  },
  {
    key: "passe", title: "Passe", emoji: "🤲",
    question: "Pour faire une passe haute à un coéquipier…",
    answers: [
      "Je découvre la passe à dix doigts",
      "Ma passe est jouable quand le ballon m'arrive bien",
      "Je fais des passes régulières à l'attaquant",
      "Je peux distribuer le jeu et varier mes passes",
    ],
  },
  {
    key: "attaque", title: "Attaque", emoji: "💥",
    question: "Quand on te fait une belle passe près du filet…",
    answers: [
      "Je renvoie le ballon de l'autre côté comme je peux",
      "Je le frappe en l'air, sans trop de puissance",
      "J'attaque avec une course d'élan et un vrai smash",
      "Je choisis ma zone : smash, feinte, ballon placé",
    ],
  },
  {
    key: "bloc", title: "Contre", emoji: "🧱",
    question: "Au filet, face à un attaquant adverse…",
    answers: [
      "Je ne monte pas encore au contre",
      "Je saute au contre de temps en temps",
      "Je contre régulièrement et je ferme une zone",
      "Je lis l'attaque et je fais souvent des contres gagnants",
    ],
  },
  {
    key: "defense", title: "Défense", emoji: "🛡️",
    question: "Quand l'adversaire attaque fort…",
    answers: [
      "Le ballon va souvent trop vite pour moi",
      "Je touche le ballon quand il arrive sur moi",
      "Je me place bien et je relève pas mal de ballons",
      "Je plonge, j'anticipe et je relève des ballons difficiles",
    ],
  },
];

export const YEARS_ANSWERS = ["Moins d'un an", "1 à 3 ans", "3 à 10 ans", "Plus de 10 ans"];
export const PLAY_ANSWERS = [
  "Seulement en loisir, entre amis",
  "Loisir régulier ou à l'école",
  "En club, sans compétition ou en championnat loisir",
  "En compétition fédérale (départemental et au-delà)",
];

export const POSTES: { key: Poste; label: string; hint: string }[] = [
  { key: "polyvalent", label: "Un peu partout", hint: "Je joue là où on a besoin de moi" },
  { key: "passeur", label: "Passeur·se", hint: "J'aime organiser le jeu" },
  { key: "attaquant", label: "Attaque / réception", hint: "Ailier, pointu" },
  { key: "central", label: "Central·e", hint: "Contre et attaques rapides" },
  { key: "libero", label: "Libéro / défense", hint: "Réception et défense" },
];

export const GUEST_LEVELS = ["Débute", "Joue en loisir", "Joue régulièrement", "Joue en club"];

const WEIGHTS: Record<SkillKey, number> = {
  service: 0.18, reception: 0.2, passe: 0.17, attaque: 0.2, bloc: 0.1, defense: 0.15,
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Niveau global sur 10 : 80 % gestes techniques, 20 % expérience. */
export function playerLevel(p: Pick<Player, "skills" | "years" | "play">): number {
  let s = 0;
  for (const k of Object.keys(WEIGHTS) as SkillKey[]) s += WEIGHTS[k] * ((p.skills[k] ?? 1) - 1) / 3;
  const exp = ((p.years ?? 0) + (p.play ?? 0)) / 6;
  return round1(10 * (0.8 * s + 0.2 * exp));
}

export const age = (birthYear: number, now = new Date()) => now.getFullYear() - birthYear;

export function playerToMember(p: Player): Member {
  return {
    id: p.id, name: p.name, sex: p.sex, age: p.birthYear ? age(p.birthYear) : null,
    level: playerLevel(p), skills: p.skills, poste: p.poste, guest: false,
  };
}

export function guestToMember(g: Guest): Member {
  const lvl = Math.min(4, Math.max(1, g.level));
  const skills = { service: lvl, reception: lvl, passe: lvl, attaque: lvl, bloc: lvl, defense: lvl };
  return {
    id: `guest:${g.id}`, name: g.name, sex: g.sex, age: null,
    level: playerLevel({ skills, years: lvl - 1, play: lvl - 1 }), skills, poste: "polyvalent", guest: true,
  };
}

/** Points forts formulés positivement pour la page profil. */
export function strengths(p: Player): string[] {
  const max = Math.max(...Object.values(p.skills));
  return SKILL_QUESTIONS.filter((q) => p.skills[q.key] === max).map((q) => q.title);
}
