import type { ImageSource, Item } from "./types";

const ORDER: ImageSource[] = ["product", "cutout", "ai", "photo"];
const FIELD: Record<ImageSource, keyof Item> = { product: "productImage", cutout: "cutout", ai: "aiImage", photo: "photo" };

/** Image à afficher : celle choisie, sinon officielle > détourée > IA > photo brute. */
export function displayImage(item: Item): { src: string; source: ImageSource } | null {
  const pick = (s: ImageSource) => {
    const v = item[FIELD[s]];
    return typeof v === "string" && v ? { src: v, source: s } : null;
  };
  if (item.imageSource) {
    const chosen = pick(item.imageSource);
    if (chosen) return chosen;
  }
  for (const s of ORDER) {
    const v = pick(s);
    if (v) return v;
  }
  return null;
}

export const SOURCE_LABEL: Record<ImageSource, string> = {
  product: "Photo officielle",
  cutout: "Ma photo détourée",
  ai: "Packshot IA",
  photo: "Ma photo",
};
