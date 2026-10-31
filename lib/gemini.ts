import "server-only";
import { GoogleGenAI, type Part } from "@google/genai";

// Toute l'intelligence « style » passe par Gemini : pas de règles figées dans le code.
// Le modèle par défaut est l'alias "gemini-flash-latest" (mis à jour par Google).

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

let client: GoogleGenAI | null = null;
function ai() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquante (Vercel > Settings > Environment Variables).");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

/** Socle de principes validés par plusieurs sources (voir docs/CONCEPT.md). */
export const STYLIST_SYSTEM = `Tu es un·e styliste personnel·le francophone, bienveillant·e et précis·e,
pour des personnes qui veulent bien s'habiller sans savoir comment. Tu parles simplement, sans jargon.

Principes de base (consensus de plusieurs sources mode) :
- La coupe et les proportions priment sur la tendance et la taille : longueur des ourlets, hauteur de taille, épaules justes.
- La morphologie est un point de départ, pas une règle rigide : raisonne en proportions (équilibrer haut/bas, marquer ou non la taille).
- Couleurs : sous-ton (chaud/froid/neutre), contraste cheveux/peau/yeux, saison colorimétrique. Les couleurs flatteuses vont près du visage.
- Harmonies : base de neutres + une couleur d'accent ; ton sur ton ; analogues ; complémentaires dosées (une dominante, une touche).
- Une tenue complète inclut haut, bas (ou robe), couche extérieure si la météo l'exige, chaussures et 1–2 accessoires.
- Météo : superposition (layering) quand l'écart de températures est grand, matières adaptées à la pluie/au froid.
- Occasion : respecte le code vestimentaire attendu, en restant fidèle à la personne.
- Reste actuel·le (saison en cours), mais préfère des pièces durables aux micro-tendances.
- Ne jamais inventer d'URL de produit ni de référence exacte : décris la pièce et propose une requête de recherche.`;

export async function generateJSON<T>(opts: {
  prompt: string;
  schema: object;
  images?: { mimeType: string; data: string }[];
  temperature?: number;
}): Promise<T> {
  const parts: Part[] = [
    ...(opts.images ?? []).map((i) => ({ inlineData: { mimeType: i.mimeType, data: i.data } })),
    { text: opts.prompt },
  ];
  const res = await ai().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: STYLIST_SYSTEM,
      responseMimeType: "application/json",
      responseJsonSchema: opts.schema,
      temperature: opts.temperature ?? 0.7,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Réponse vide de Gemini");
  return JSON.parse(text) as T;
}

/** Recherche web en direct (Google Search grounding) pour rester à jour sur les tendances. */
export async function groundedSearch(prompt: string) {
  const res = await ai().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction: STYLIST_SYSTEM, tools: [{ googleSearch: {} }], temperature: 0.3 },
  });
  const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources = chunks
    .map((c) => c.web)
    .filter((w): w is { uri: string; title?: string } => !!w?.uri)
    .map((w) => ({ url: w.uri, title: w.title ?? w.uri }));
  const unique = [...new Map(sources.map((s) => [s.url, s])).values()];
  return { text: res.text ?? "", sources: unique };
}

// Cache mémoire (par instance serverless) des tendances du jour.
const trendCache = new Map<string, { at: number; value: Awaited<ReturnType<typeof groundedSearch>> }>();

export async function currentTrends(sex: string) {
  const key = `${sex}-${new Date().toISOString().slice(0, 10)}`;
  const hit = trendCache.get(key);
  if (hit) return hit.value;
  const today = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const value = await groundedSearch(
    `Nous sommes en ${today}. Résume les tendances mode ${sex === "homme" ? "homme" : sex === "femme" ? "femme" : "mixtes"} ` +
      `ACTUELLES pour la saison en cours, en ne retenant que ce qui est cité par plusieurs médias reconnus ` +
      `(Vogue, GQ, Elle, Harper's Bazaar, Business of Fashion, Numéro, FashionUnited…). ` +
      `Donne : 1) silhouettes et coupes, 2) pièces clés, 3) couleurs de la saison, 4) matières/motifs, ` +
      `5) ce qui est en perte de vitesse. Format : listes courtes en français, faciles à appliquer au quotidien.`,
  );
  trendCache.set(key, { at: Date.now(), value });
  return value;
}

export function parseDataUrl(dataUrl: string) {
  const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) throw new Error("Image invalide");
  return { mimeType: m[1], data: m[2] };
}
