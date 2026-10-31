// Outils de théorie des couleurs (roue chromatique). L'IA décide du style,
// ce module sert à visualiser et expliquer les harmonies.

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return { h: 0, s: 0, l: 50 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** Neutres « mode » : noir, blanc, gris, beige, camel, marron, marine, denim délavé. */
export function isNeutral(hex: string): boolean {
  const { h, s, l } = hexToHsl(hex);
  if (s < 15 || l < 12 || l > 92) return true; // noir / blanc / gris
  if (h >= 15 && h <= 45 && s < 60 && l < 75) return true; // beiges, camels, marrons
  if (h >= 200 && h <= 235 && l < 30) return true; // marine
  return false;
}

const hueDist = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export type Harmony =
  | "Neutres"
  | "Ton sur ton"
  | "Analogue"
  | "Complémentaire"
  | "Triadique"
  | "Accent sur neutres"
  | "Libre";

/** Détermine l'harmonie dominante d'un ensemble de couleurs. */
export function harmonyOf(hexes: string[]): Harmony {
  const colored = hexes.filter((h) => !isNeutral(h));
  if (colored.length === 0) return "Neutres";
  if (colored.length === 1) return hexes.length > 1 ? "Accent sur neutres" : "Ton sur ton";
  const hues = colored.map((h) => hexToHsl(h).h);
  const pairs: number[] = [];
  for (let i = 0; i < hues.length; i++)
    for (let j = i + 1; j < hues.length; j++) pairs.push(hueDist(hues[i], hues[j]));
  const max = Math.max(...pairs);
  if (max <= 20) return "Ton sur ton";
  if (max <= 60) return "Analogue";
  if (pairs.some((d) => d >= 150)) return "Complémentaire";
  if (pairs.every((d) => d >= 100 && d <= 140)) return "Triadique";
  return "Libre";
}

export const HARMONY_HELP: Record<Harmony, string> = {
  Neutres: "Base neutre : élégant et facile, jouez sur les matières.",
  "Ton sur ton": "Même famille de couleur en plusieurs intensités : très actuel.",
  Analogue: "Couleurs voisines sur la roue : harmonie douce et naturelle.",
  Complémentaire: "Couleurs opposées : contraste fort, à doser (une dominante, une touche).",
  Triadique: "Trois couleurs équidistantes : audacieux, gardez une dominante.",
  "Accent sur neutres": "Une couleur forte sur une base neutre : la règle la plus sûre.",
  Libre: "Mélange libre : vérifiez qu'une couleur domine.",
};

export function textOn(hex: string) {
  return hexToHsl(hex).l > 60 ? "#1b1a17" : "#fbf9f4";
}
