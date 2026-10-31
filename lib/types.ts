export type Sex = "femme" | "homme" | "non-binaire";
export type Undertone = "chaud" | "froid" | "neutre" | "inconnu";

export const MORPHOLOGIES: Record<Sex, { id: string; label: string; hint: string }[]> = {
  femme: [
    { id: "sablier", label: "Sablier (X)", hint: "Épaules et hanches alignées, taille marquée" },
    { id: "triangle", label: "Triangle (A)", hint: "Hanches plus larges que les épaules" },
    { id: "triangle-inverse", label: "Triangle inversé (V)", hint: "Épaules plus larges que les hanches" },
    { id: "rectangle", label: "Rectangle (H)", hint: "Épaules, taille et hanches proches" },
    { id: "ovale", label: "Ovale (O)", hint: "Volume concentré au niveau du ventre" },
  ],
  homme: [
    { id: "trapeze", label: "Trapèze", hint: "Épaules un peu plus larges que la taille" },
    { id: "triangle-inverse", label: "Triangle inversé (V)", hint: "Épaules nettement plus larges, taille fine" },
    { id: "rectangle", label: "Rectangle (H)", hint: "Épaules et taille de même largeur" },
    { id: "triangle", label: "Triangle (A)", hint: "Hanches/taille plus larges que les épaules" },
    { id: "ovale", label: "Ovale (O)", hint: "Volume concentré au niveau du ventre" },
  ],
  "non-binaire": [
    { id: "sablier", label: "Sablier (X)", hint: "Épaules et hanches alignées, taille marquée" },
    { id: "triangle", label: "Triangle (A)", hint: "Hanches plus larges que les épaules" },
    { id: "triangle-inverse", label: "Triangle inversé (V)", hint: "Épaules plus larges que les hanches" },
    { id: "rectangle", label: "Rectangle (H)", hint: "Silhouette droite" },
    { id: "ovale", label: "Ovale (O)", hint: "Volume concentré au niveau du ventre" },
  ],
};

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  morphology: string;
  skinHex: string;
  undertone: Undertone;
  eyeColor: string;
  hairHex: string;
  hairLabel: string;
  styleGoals: string[];
  budget: "petit" | "moyen" | "premium";
  city: string;
  shops: string[];
  colorSeason?: string; // calculé par l'IA lors de l'analyse
}

export const CATEGORIES = [
  "haut",
  "pull",
  "chemise",
  "bas",
  "robe",
  "veste",
  "manteau",
  "chaussures",
  "sac",
  "accessoire",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ItemColor {
  hex: string;
  name: string;
}

export interface Item {
  id: string;
  photo?: string; // data URL compressée
  name: string;
  category: Category;
  subtype: string;
  colors: ItemColor[];
  pattern: string;
  material: string;
  fit: string;
  formality: number; // 1 (très casual) → 5 (très habillé)
  warmth: number; // 1 (très léger) → 5 (très chaud)
  seasons: string[];
  styleTags: string[];
  brand?: string;
  wornCount: number;
  lastWorn?: string;
  createdAt: string;
}

export interface MissingPiece {
  name: string;
  category: string;
  colorHex: string;
  colorName: string;
  why: string;
  searchQuery: string;
  brands: string[];
  priority?: "haute" | "moyenne" | "basse";
}

export interface Outfit {
  title: string;
  itemIds: string[];
  missing: MissingPiece[];
  why: string;
  colorStory: string;
  tip: string;
}

export interface Weather {
  city: string;
  tempNow: number;
  tempMin: number;
  tempMax: number;
  feelsLike: number;
  precipProb: number;
  wind: number;
  code: number;
  label: string;
}

export interface WornEntry {
  date: string;
  itemIds: string[];
  occasion: string;
}

export const OCCASIONS = [
  { id: "quotidien", label: "Quotidien", emoji: "☕" },
  { id: "travail", label: "Travail / bureau", emoji: "💼" },
  { id: "rendez-vous", label: "Rendez-vous", emoji: "🍷" },
  { id: "soiree", label: "Soirée / sortie", emoji: "✨" },
  { id: "sport", label: "Sport / balade", emoji: "🌿" },
  { id: "entretien", label: "Entretien d'embauche", emoji: "🤝" },
  { id: "mariage", label: "Mariage / cérémonie", emoji: "💐" },
  { id: "voyage", label: "Voyage", emoji: "✈️" },
];
