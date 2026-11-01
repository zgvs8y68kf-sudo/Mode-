import { cachedTrends, generateJSON, parseDataUrl } from "@/lib/gemini";
import { auditSchema } from "@/lib/schemas";
import { describeProfile } from "@/lib/describe";
import { shopsForPrompt } from "@/lib/shops";
import { jsonError, readBody, requireUser } from "@/lib/api";
import type { Profile } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const { profile, wardrobe, selfie } = await readBody<{
      profile: Profile;
      wardrobe: unknown[];
      selfie?: string;
    }>(req);
    const trends = cachedTrends(profile.sex);
    const result = await generateJSON({
      schema: auditSchema,
      images: selfie ? [parseDataUrl(selfie)] : undefined,
      temperature: 0.5,
      prompt: `Fais l'audit complet du dressing de cette personne.

PROFIL
${describeProfile(profile)}
${selfie ? "Une photo du visage en lumière naturelle est jointe : utilise-la pour affiner sous-ton, contraste et saison colorimétrique." : ""}

TENDANCES ACTUELLES (recherche web du jour) :
${trends?.text?.slice(0, 3000) ?? "non disponibles"}

${shopsForPrompt(profile.budget, profile.shops)}

GARDE-ROBE (JSON) :
${JSON.stringify(wardrobe)}

Attendu :
1. Saison colorimétrique (avec la logique : sous-ton, valeur, contraste) + palette flatteuse et couleurs à éviter près du visage.
2. Conseils de coupes selon la morphologie et la taille (en proportions, pas en interdits).
3. 2 à 3 directions de style qui lui iraient, en partant de ce qu'elle possède déjà.
4. Forces / faiblesses du dressing (équilibre des catégories, polyvalence, neutres vs couleurs, saisons couvertes).
5. Pièces manquantes à plus fort impact (celles qui créent le plus de nouvelles tenues), en tenant compte du budget.
   Ex. "t-shirt vert sauge en coton épais : s'associe avec ton jean brut et ta veste camel".`,
    });
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
