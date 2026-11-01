import { cachedTrends, generateJSON } from "@/lib/gemini";
import { outfitsSchema } from "@/lib/schemas";
import { describeProfile } from "@/lib/describe";
import { jsonError, readBody, requireUser } from "@/lib/api";
import type { Profile, Weather, WornEntry } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const { profile, wardrobe, weather, occasion, note, recent } = await readBody<{
      profile: Profile;
      wardrobe: unknown[];
      weather: Weather | null;
      occasion: string;
      note?: string;
      recent?: WornEntry[];
    }>(req);

    const trends = cachedTrends(profile.sex);
    const result = await generateJSON({
      schema: outfitsSchema,
      prompt: `Propose 3 tenues COMPLÈTES et différentes pour aujourd'hui (${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}).

PROFIL
${describeProfile(profile)}

OCCASION : ${occasion}${note ? `\nPRÉCISION : ${note}` : ""}

MÉTÉO : ${
        weather
          ? `${weather.city} — ${weather.label}, ${weather.tempMin}°C → ${weather.tempMax}°C (ressenti ${weather.feelsLike}°C), pluie ${weather.precipProb}%, vent ${weather.wind} km/h`
          : "inconnue (tenue de mi-saison)"
      }

TENDANCES ACTUELLES (recherche web du jour, à utiliser avec mesure) :
${trends?.text?.slice(0, 2500) ?? "non disponibles"}

PORTÉ RÉCEMMENT (évite de répéter les mêmes associations) :
${JSON.stringify(recent?.slice(0, 7) ?? [])}

GARDE-ROBE (JSON, utilise UNIQUEMENT ces id dans itemIds) :
${JSON.stringify(wardrobe)}

Règles :
- Chaque tenue : haut + bas (ou robe), couche extérieure si nécessaire, chaussures, 1–2 accessoires.
- Si une catégorie essentielle manque dans la garde-robe, ou si une pièce sublimerait la tenue, ajoute-la dans "missing" (max 2).
- Varie les registres : une tenue sûre, une plus tendance, une avec une pointe d'audace.
- Explique simplement pourquoi ça marche pour CETTE personne.`,
    });
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
