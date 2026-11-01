import { generateJSON, parseDataUrl } from "@/lib/gemini";
import { itemSchema } from "@/lib/schemas";
import { jsonError, readBody, requireUser } from "@/lib/api";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const { photo } = await readBody<{ photo: string }>(req);
    const result = await generateJSON({
      images: [parseDataUrl(photo)],
      temperature: 0.2,
      schema: itemSchema,
      prompt:
        "Numérise ce vêtement / cet accessoire pour une garde-robe digitale. " +
        "Identifie précisément la pièce principale de la photo (ignore le fond et la personne). " +
        "Couleurs : donne les vraies teintes du tissu en #hex (corrige l'éclairage), dominante en premier. " +
        "Formalité 1 = jogging, 3 = smart casual, 5 = tenue de cérémonie. Chaleur 1 = très léger, 5 = très chaud.",
    });
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
