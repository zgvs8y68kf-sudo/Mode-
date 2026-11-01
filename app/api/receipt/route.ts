import { generateJSON, parseDataUrl } from "@/lib/gemini";
import { receiptSchema } from "@/lib/schemas";
import { HttpError, jsonError, readBody, requireUser } from "@/lib/api";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const { images } = await readBody<{ images: string[] }>(req, 6_000_000);
    if (!images?.length) throw new HttpError(400, "Aucune image de ticket");
    const result = await generateJSON({
      images: images.slice(0, 4).map(parseDataUrl),
      temperature: 0.1,
      schema: receiptSchema,
      prompt: `Lis ce ticket de caisse (ou facture / e-mail de confirmation de commande, éventuellement en plusieurs photos) et transforme chaque article de mode en pièce de garde-robe.

Méthode :
1. Repère l'enseigne, la date et chaque ligne d'article (libellé, référence, taille, quantité, prix).
2. Ignore tout ce qui n'est pas vêtement, chaussure, sac ou accessoire de mode (sac de caisse, carte cadeau, remise globale, frais de port, cosmétique, maison).
3. Décode les libellés abrégés des enseignes (ex. "TS COL RD" = t-shirt col rond, "PANT" = pantalon, "JN" = jean, "SWT" = sweat, "CHEM" = chemise, "BLZ" = blazer, "MAN" = manteau, "BASK" = baskets).
   Utilise ta connaissance des gammes de l'enseigne pour compléter (ex. Uniqlo "AIRism", "Heattech", "U" ; Levi's "501" = jean droit).
4. Pour chaque article, remplis la fiche : nom clair en français, catégorie, sous-type, couleurs (#hex et nom), motif, matière, coupe, formalité (1-5), chaleur (1-5), saisons, style.
   - Couleur écrite sur le ticket (BLANC, NOIR, ECRU, BEIGE, KAKI, MARINE…) → colorConfidence "lue".
   - Couleur devinée → "déduite". Aucune idée → couleur neutre plausible et "inconnue".
   - Si l'information manque, déduis la valeur la plus probable pour ce type de pièce.
5. brand = l'enseigne (ou la marque de l'article si différente, ex. chez Zalando).
6. Si quantité > 1 pour la même ligne, garde une seule entrée avec quantity.`,
    });
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
