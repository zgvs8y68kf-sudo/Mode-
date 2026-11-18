export type Sex = "F" | "M";
export type SkillKey = "service" | "reception" | "passe" | "attaque" | "bloc" | "defense";
export type Poste = "polyvalent" | "passeur" | "attaquant" | "central" | "libero";
export type Presence = "yes" | "maybe" | "no";

/** Profil rempli une fois via le questionnaire. Les compétences vont de 1 à 5. */
export interface Player {
  id: string;
  name: string;
  sex: Sex;
  birthYear: number;
  skills: Record<SkillKey, number>;
  /** Ancienneté de 0 (moins d'un an) à 3 (plus de 10 ans). */
  years: number;
  poste: Poste;
  /** Profil express : une seule note globale, appliquée à tous les gestes. */
  express?: boolean;
  /** Version du barème (2 = notes de 1 à 5). */
  v?: number;
  updatedAt: number;
}

/** Personne venue ponctuellement, sans compte : on lui donne juste un niveau global (1 à 5). */
export interface Guest {
  id: string;
  name: string;
  sex: Sex;
  level: number;
  addedBy: string;
}

export interface Teams {
  at: number;
  by: string;
  /** Identifiants : uid d'un joueur ou "guest:<id>". */
  groups: string[][];
}

export interface Session {
  id: string;
  /** AAAA-MM-JJ */
  date: string;
  /** HH:MM */
  time: string;
  place: string;
  createdBy: string;
  createdAt: number;
  presence: Record<string, Presence>;
  guests: Record<string, Guest>;
  teams?: Teams | null;
}

/** Forme commune joueur / invité utilisée pour composer les équipes. */
export interface Member {
  id: string;
  name: string;
  sex: Sex;
  age: number | null;
  /** Niveau global sur 10. */
  level: number;
  skills: Record<SkillKey, number>;
  poste: Poste;
  guest: boolean;
}
