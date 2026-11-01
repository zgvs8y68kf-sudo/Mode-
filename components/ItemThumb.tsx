"use client";

import { useState } from "react";
import { displayImage } from "@/lib/itemImage";
import type { Item } from "@/lib/types";
import Silhouette from "./Silhouette";

/** Visuel d'une pièce : photo officielle / détourée / IA / photo, sinon silhouette colorée. */
export function ItemVisual({ item, className = "", contain = false, pad = "p-[12%]" }: { item: Item; className?: string; contain?: boolean; pad?: string }) {
  const img = displayImage(item);
  const [broken, setBroken] = useState<string | null>(null);
  if (img && broken !== img.src) {
    const clean = img.source !== "photo";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={img.src} alt={item.name} referrerPolicy="no-referrer" loading="lazy" onError={() => setBroken(img.src)}
        className={`${className} ${clean ? "object-contain mix-blend-multiply" : contain ? "rounded-lg object-contain" : "object-cover"}`} />
    );
  }
  return <Silhouette category={item.category} subtype={item.subtype} hex={item.colors[0]?.hex} pattern={item.pattern} className={`${className} ${pad}`} />;
}

export default function ItemThumb({ item, size = "md" }: { item: Item; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-20 w-20" : "aspect-square w-full";
  return (
    <div className={`${dim} overflow-hidden rounded-xl border border-line bg-white`}>
      <ItemVisual item={item} className="h-full w-full" />
    </div>
  );
}
