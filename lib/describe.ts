import { SHOPS } from "./shops";
import type { Profile } from "./types";

export function describeProfile(p: Profile) {
  return [
    `Prénom : ${p.name || "—"}`,
    `Genre : ${p.sex}, ${p.age} ans, ${p.heightCm} cm`,
    `Morphologie : ${p.morphology}`,
    `Peau : ${p.skinHex} (sous-ton ${p.undertone})`,
    `Yeux : ${p.eyeColor} — Cheveux : ${p.hairLabel} (${p.hairHex})`,
    p.colorSeason ? `Saison colorimétrique estimée : ${p.colorSeason}` : "",
    `Objectifs de style : ${p.styleGoals.join(", ") || "s'habiller mieux, simplement"}`,
    `Budget : ${p.budget} — Enseignes préférées : ${p.shops.map((id) => SHOPS.find((s) => s.id === id)?.name ?? id).join(", ") || "aucune"}`,
  ]
    .filter(Boolean)
    .join("\n");
}
