import { generateJSON, parseDataUrl } from "@/lib/gemini";
import { bodyProfileSchema } from "@/lib/schemas";
import { HttpError, jsonError, readBody, requireUser } from "@/lib/api";

export const maxDuration = 60;

// Les photos ne sont ni stockées ni journalisées : elles transitent uniquement vers Gemini.
export async function POST(req: Request) {
  try {
    await requireUser(req);
    const { body, face, heightCm } = await readBody<{ body: string; face?: string; heightCm?: number }>(req, 4_000_000);
    if (!body) throw new HttpError(400, "Photo en pied manquante");
    const result = await generateJSON({
      images: [parseDataUrl(body), ...(face ? [parseDataUrl(face)] : [])],
      temperature: 0.2,
      schema: bodyProfileSchema,
      prompt: `Tu analyses la silhouette d'une personne adulte, avec son consentement, pour un service de conseil en style.
Image 1 : photo en pied, de face, en sous-vêtements ou en tenue près du corps.${face ? "\nImage 2 : selfie en lumière naturelle (pour la carnation, le sous-ton, les yeux et les cheveux)." : ""}
${heightCm ? `Taille déclarée : ${heightCm} cm.` : ""}

Règles :
- Si la personne semble mineure, s'il y a de la nudité, ou si la silhouette n'est pas visible en entier : usable=false et explique comment refaire la photo. Remplis quand même les autres champs avec des valeurs neutres.
- Morphologie : compare la largeur des épaules, de la taille et des hanches, et la définition de la taille. Choisis la catégorie la plus proche dans la liste du sexe/rayon retenu.
- Couleurs : corrige l'éclairage (balance des blancs) avant d'estimer la carnation et le sous-ton. Les veines, le rendu or/argent et les cheveux naturels sont des indices.
- Ton bienveillant et factuel : jamais de jugement sur le poids ou le corps, on parle de proportions et de mise en valeur.`,
    });
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
