import { generateJSON, parseDataUrl } from "@/lib/gemini";
import { itemSchema } from "@/lib/schemas";
import { jsonError, readBody, requireUser } from "@/lib/api";

export const maxDuration = 60;

// Fiche + contour du vêtement (polygone) pour le détourage côté navigateur.
const schema = {
  ...itemSchema,
  properties: {
    ...itemSchema.properties,
    outline: {
      type: "array",
      description:
        "Contour précis de la pièce principale UNIQUEMENT (sans la personne, la peau, le cintre ni le fond) : polygone de 16 à 60 points [y, x] normalisés de 0 à 1000, dans l'ordre, en suivant les bords (manches, col, ourlet).",
      items: { type: "array", items: { type: "integer", minimum: 0, maximum: 1000 } },
    },
  },
  required: [...itemSchema.required, "outline"],
};

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const { photo } = await readBody<{ photo: string }>(req);
    const result = await generateJSON({
      images: [parseDataUrl(photo)],
      temperature: 0.2,
      schema,
      prompt:
        "Numérise ce vêtement / cet accessoire pour une garde-robe digitale. " +
        "Identifie précisément la pièce principale de la photo (ignore le fond et la personne). " +
        "Couleurs : donne les vraies teintes du tissu en #hex (corrige l'éclairage), dominante en premier. " +
        "Formalité 1 = jogging, 3 = smart casual, 5 = tenue de cérémonie. Chaleur 1 = très léger, 5 = très chaud. " +
        "Donne aussi le contour (outline) de la pièce pour la détourer.",
    });
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
