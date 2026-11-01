"use client";

import type { Item, MissingPiece } from "@/lib/types";
import { ItemVisual } from "./ItemThumb";
import Silhouette, { shapeFor } from "./Silhouette";

// Planche « flat lay » : toutes les pièces de la tenue assemblées comme une photo de magazine.
type Slot = "outer" | "top" | "layer" | "bottom" | "dress" | "shoes" | "bag" | "acc1" | "acc2" | "acc3";

const POS: Record<Slot, { l: number; t: number; w: number; h: number; r: number }> = {
  outer: { l: 0, t: 3, w: 38, h: 52, r: -3 },
  top: { l: 30, t: 1, w: 40, h: 36, r: 0 },
  layer: { l: 62, t: 3, w: 37, h: 34, r: 4 },
  dress: { l: 28, t: 2, w: 44, h: 72, r: 0 },
  bottom: { l: 33, t: 34, w: 34, h: 48, r: 1 },
  shoes: { l: 34, t: 80, w: 32, h: 19, r: -2 },
  bag: { l: 2, t: 58, w: 32, h: 30, r: -4 },
  acc1: { l: 68, t: 38, w: 30, h: 21, r: 6 },
  acc2: { l: 68, t: 60, w: 30, h: 21, r: -5 },
  acc3: { l: 70, t: 80, w: 26, h: 18, r: 3 },
};

type Entry = { key: string; item?: Item; missing?: MissingPiece; shape: string };

function slotOf(shape: string): Slot[] {
  if (["manteau", "veste"].includes(shape)) return ["outer", "layer"];
  if (shape === "robe") return ["dress"];
  if (["tshirt", "pull", "chemise"].includes(shape)) return ["top", "layer"];
  if (["pantalon", "short", "jupe"].includes(shape)) return ["bottom"];
  if (["basket", "bottine", "escarpin"].includes(shape)) return ["shoes"];
  if (shape === "sac") return ["bag", "acc3"];
  return ["acc1", "acc2", "acc3", "bag"];
}

export default function OutfitBoard({ items, missing = [] }: { items: Item[]; missing?: MissingPiece[] }) {
  const entries: Entry[] = [
    ...items.map((i) => ({ key: i.id, item: i, shape: shapeFor(i.category, i.subtype) })),
    ...missing.map((m, i) => ({ key: `m${i}`, missing: m, shape: shapeFor(m.category, m.name) })),
  ];
  const used = new Set<Slot>();
  const placed: (Entry & { slot: Slot })[] = [];
  // Ordre : vêtements principaux d'abord pour qu'ils obtiennent les meilleures places.
  const rank = (e: Entry) => (["robe", "pantalon", "short", "jupe"].includes(e.shape) ? 0 : ["tshirt", "pull", "chemise"].includes(e.shape) ? 1 : 2);
  for (const e of [...entries].sort((a, b) => rank(a) - rank(b))) {
    const slot = slotOf(e.shape).find((s) => !used.has(s) && !(s === "top" && used.has("dress")) && !(s === "bottom" && used.has("dress")));
    if (slot) { used.add(slot); placed.push({ ...e, slot }); }
  }
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white">
      {placed.map(({ key, item, missing: m, slot }) => {
        const p = POS[slot];
        return (
          <div key={key} className="absolute" style={{ left: `${p.l}%`, top: `${p.t}%`, width: `${p.w}%`, height: `${p.h}%`, transform: `rotate(${p.r}deg)` }}>
            {item ? (
              <ItemVisual item={item} className="h-full w-full" contain pad="p-[3%]" />
            ) : m ? (
              <div className="relative h-full w-full">
                <Silhouette category={m.category} subtype={m.name} hex={m.colorHex} className="h-full w-full p-[3%] opacity-60" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[9px] font-medium text-card shadow">+ à ajouter</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
