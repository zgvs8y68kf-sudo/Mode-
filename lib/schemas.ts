// Schémas JSON imposés à Gemini (structured output).
import { CATEGORIES } from "./types";

const color = {
  type: "object",
  properties: {
    hex: { type: "string", description: "Couleur au format #rrggbb" },
    name: { type: "string", description: "Nom de la couleur en français, ex. 'vert sauge'" },
  },
  required: ["hex", "name"],
};

export const itemSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Nom court, ex. 'Pull col rond en maille côtelée'" },
    category: { type: "string", enum: [...CATEGORIES] },
    subtype: { type: "string", description: "ex. t-shirt, jean droit, derbies, écharpe" },
    colors: { type: "array", items: color, description: "1 à 3 couleurs, dominante en premier" },
    pattern: { type: "string", description: "uni, rayures, carreaux, imprimé…" },
    material: { type: "string" },
    fit: { type: "string", description: "ajusté, droit, ample, oversize, wide-leg, barrel…" },
    formality: { type: "integer", minimum: 1, maximum: 5 },
    warmth: { type: "integer", minimum: 1, maximum: 5 },
    seasons: { type: "array", items: { type: "string", enum: ["printemps", "été", "automne", "hiver"] } },
    styleTags: { type: "array", items: { type: "string" }, description: "ex. minimaliste, workwear, preppy, sport-chic" },
    brand: { type: "string", description: "Marque si visible, sinon chaîne vide" },
  },
  required: ["name", "category", "subtype", "colors", "pattern", "material", "fit", "formality", "warmth", "seasons", "styleTags"],
};

export const missingSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Description précise de la pièce, ex. 't-shirt en coton épais vert pastel'" },
    category: { type: "string" },
    colorHex: { type: "string" },
    colorName: { type: "string" },
    why: { type: "string", description: "Pourquoi cette pièce, avec quelles pièces existantes elle s'associe" },
    searchQuery: { type: "string", description: "Requête de recherche courte en français pour un e-shop" },
    brands: { type: "array", items: { type: "string" }, description: "Enseignes où ce type de pièce existe typiquement (Uniqlo, Zara, H&M, Levi's, Zalando…)" },
    priority: { type: "string", enum: ["haute", "moyenne", "basse"] },
  },
  required: ["name", "category", "colorHex", "colorName", "why", "searchQuery", "brands"],
};

export const outfitsSchema = {
  type: "object",
  properties: {
    weatherAdvice: { type: "string", description: "Une phrase sur l'adaptation à la météo" },
    outfits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          itemIds: { type: "array", items: { type: "string" }, description: "IDs EXACTS des pièces de la garde-robe" },
          missing: { type: "array", items: missingSchema, description: "Pièces manquantes qui compléteraient la tenue (0 à 2)" },
          why: { type: "string", description: "Pourquoi cette tenue va à la personne (morphologie, couleurs, occasion)" },
          colorStory: { type: "string", description: "L'harmonie de couleurs utilisée" },
          tip: { type: "string", description: "Un conseil de stylisme concret (rentrer le haut, retrousser, etc.)" },
        },
        required: ["title", "itemIds", "missing", "why", "colorStory", "tip"],
      },
    },
  },
  required: ["weatherAdvice", "outfits"],
};

export const auditSchema = {
  type: "object",
  properties: {
    colorSeason: { type: "string", description: "Saison colorimétrique estimée, ex. 'Automne doux'" },
    colorSeasonWhy: { type: "string" },
    bestColors: { type: "array", items: color, description: "8 couleurs flatteuses" },
    avoidColors: { type: "array", items: color, description: "3 à 4 couleurs à éloigner du visage" },
    morphologyTips: { type: "array", items: { type: "string" }, description: "4 à 6 conseils de coupes" },
    styleDirections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nom du style, ex. 'Minimalisme chaleureux'" },
          description: { type: "string" },
          fromWardrobe: { type: "array", items: { type: "string" }, description: "IDs de pièces existantes qui y contribuent" },
        },
        required: ["name", "description", "fromWardrobe"],
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    missingPieces: { type: "array", items: missingSchema, description: "5 à 8 pièces manquantes, par priorité" },
    underused: { type: "array", items: { type: "string" }, description: "IDs de pièces peu exploitées et comment les porter" },
  },
  required: ["colorSeason", "colorSeasonWhy", "bestColors", "avoidColors", "morphologyTips", "styleDirections", "strengths", "weaknesses", "missingPieces"],
};
