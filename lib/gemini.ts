import "server-only";
import { GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";

// Toute l'intelligence « style » passe par Gemini : pas de règles figées dans le code.
// Le modèle par défaut est l'alias "gemini-flash-latest" (mis à jour par Google).

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
// Modèles de secours, essayés dans l'ordre si le principal est saturé (503), hors quota (429) ou trop lent.
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash,gemini-flash-lite-latest")
  .split(",").map((m) => m.trim()).filter((m) => m && m !== MODEL);
// Génération / édition d'images (packshots). Nécessite la facturation activée sur la clé Gemini.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

let client: GoogleGenAI | null = null;
function ai() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquante (Vercel > Settings > Environment Variables).");
  client ??= new GoogleGenAI({
    apiKey,
    // Peu de retries et délai court : on préfère basculer vite sur le modèle de secours
    // (les fonctions Vercel sont limitées à 60 s).
    httpOptions: { retryOptions: { attempts: 1 } },
  });
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

type GenParams = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

/**
 * Appelle le modèle principal puis les modèles de secours (saturation, quota, délai).
 * Budget total < 60 s (limite des fonctions Vercel).
 */
async function generate(params: Omit<GenParams, "model">) {
  const config = { ...params.config, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } };
  const chain = [MODEL, ...FALLBACK_MODELS];
  const budgets = [15_000, 18_000, 20_000];
  let last: unknown;
  for (let i = 0; i < chain.length; i++) {
    try {
      return await ai().models.generateContent({
        ...params,
        model: chain[i],
        config: { ...config, abortSignal: AbortSignal.timeout(budgets[i] ?? 15_000) },
      });
    } catch (e) {
      last = e;
      console.warn(`${chain[i]} indisponible (${String((e as Error).message).slice(0, 80)})`);
    }
  }
  throw last;
}

/** Génère une image (packshot). Renvoie une data URL. */
export async function generateImage(prompt: string, images: { mimeType: string; data: string }[] = []) {
  try {
    const res = await ai().models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: "user", parts: [...images.map((i) => ({ inlineData: i })), { text: prompt }] }],
      config: { responseModalities: ["IMAGE"], abortSignal: AbortSignal.timeout(50_000) },
    });
    const img = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!img?.data) throw new Error("Aucune image générée");
    return `data:${img.mimeType ?? "image/png"};base64,${img.data}`;
  } catch (e) {
    if (/429|RESOURCE_EXHAUSTED|quota/i.test(String((e as Error).message)))
      throw new Error("La génération d'images nécessite d'activer la facturation sur la clé Gemini (Google AI Studio > Billing).");
    throw e;
  }
}

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
  const res = await generate({
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: STYLIST_SYSTEM,
      responseMimeType: "application/json",
      responseJsonSchema: opts.schema,
      temperature: opts.temperature ?? 0.7,
    },
  });
  const text = res.text;
  if (!text) {
    const blocked = res.promptFeedback?.blockReason || res.candidates?.[0]?.finishReason;
    throw new Error(
      blocked && /SAFETY|PROHIBITED|BLOCK|IMAGE_SAFETY/i.test(String(blocked))
        ? "L'image a été bloquée par le filtre de sécurité de l'IA. Réessaie avec une tenue près du corps (legging, t-shirt ajusté)."
        : "Réponse vide de Gemini",
    );
  }
  return JSON.parse(text) as T;
}

/** Recherche web en direct (Google Search grounding) pour rester à jour sur les tendances. */
let groundingOffUntil = 0;

export async function groundedSearch(prompt: string) {
  if (Date.now() < groundingOffUntil) throw new Error("Recherche web en pause (quota)");
  const res = await generate({
    contents: prompt,
    config: { systemInstruction: STYLIST_SYSTEM, tools: [{ googleSearch: {} }], temperature: 0.3 },
  });
  const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources = chunks
    .map((c) => c.web)
    .filter((w): w is { uri: string; title?: string } => !!w?.uri)
    .map((w) => ({ url: w.uri, title: w.title ?? w.uri }));
  const unique = [...new Map(sources.map((s) => [s.url, s])).values()];
  return { text: res.text ?? "", sources: unique, grounded: true };
}

/** Repli si la recherche web n'est pas disponible (quota, offre gratuite…) : connaissances du modèle. */
async function plainAnswer(prompt: string) {
  const res = await generate({
    contents: prompt,
    config: { systemInstruction: STYLIST_SYSTEM, temperature: 0.3 },
  });
  return { text: res.text ?? "", sources: [] as { url: string; title: string }[], grounded: false };
}

// Cache mémoire (par instance serverless) des tendances du jour.
const trendCache = new Map<string, { at: number; value: Awaited<ReturnType<typeof groundedSearch>> }>();

export async function currentTrends(sex: string) {
  const key = `${sex}-${new Date().toISOString().slice(0, 10)}`;
  const hit = trendCache.get(key);
  if (hit) return hit.value;
  const today = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const prompt =
    `Nous sommes en ${today}. Résume les tendances mode ${sex === "homme" ? "homme" : sex === "femme" ? "femme" : "mixtes"} ` +
      `ACTUELLES pour la saison en cours, en ne retenant que ce qui est cité par plusieurs médias reconnus ` +
      `(Vogue, GQ, Elle, Harper's Bazaar, Business of Fashion, Numéro, FashionUnited…). ` +
      `Donne : 1) silhouettes et coupes, 2) pièces clés, 3) couleurs de la saison, 4) matières/motifs, ` +
      `5) ce qui est en perte de vitesse. Format : listes courtes en français, faciles à appliquer au quotidien.`;
  try {
    const value = await groundedSearch(prompt);
    trendCache.set(key, { at: Date.now(), value });
    return value;
  } catch (e) {
    if (/429|RESOURCE_EXHAUSTED|quota/i.test(String((e as Error).message))) groundingOffUntil = Date.now() + 3_600_000;
    console.warn("Recherche web indisponible, repli sur le modèle :", (e as Error).message.slice(0, 120));
    const value = await plainAnswer(prompt);
    trendCache.set(key, { at: Date.now(), value });
    return value;
  }
}

/** Tendances déjà en cache (sans appel réseau) : utilisées par les tenues pour rester rapides. */
export function cachedTrends(sex: string) {
  return trendCache.get(`${sex}-${new Date().toISOString().slice(0, 10)}`)?.value ?? null;
}

export function parseDataUrl(dataUrl: string) {
  const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) throw new Error("Image invalide");
  return { mimeType: m[1], data: m[2] };
}
