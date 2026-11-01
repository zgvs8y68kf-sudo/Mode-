import { generateImage, parseDataUrl } from "@/lib/gemini";
import { HttpError, jsonError, readBody, requireUser } from "@/lib/api";

export const maxDuration = 60;

const STYLE =
  "Photo produit e-commerce professionnelle (packshot) : le vêtement seul, posé à plat et bien lissé, vu de face, centré, " +
  "sur fond blanc pur #ffffff, lumière douce de studio, sans personne, sans mannequin, sans cintre, sans texte, format carré.";

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const { photo, description } = await readBody<{ photo?: string; description?: string }>(req);
    if (!photo && !description) throw new HttpError(400, "Photo ou description requise");
    const image = photo
      ? await generateImage(`À partir de cette photo, recrée la même pièce, à l'identique (couleur, matière, détails). ${STYLE}`, [parseDataUrl(photo)])
      : await generateImage(`${STYLE} La pièce : ${description}.`);
    return Response.json({ image });
  } catch (e) {
    return jsonError(e);
  }
}
