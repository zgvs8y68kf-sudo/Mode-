"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { toWhiteJpeg } from "@/lib/cutout";
import { SOURCE_LABEL, displayImage } from "@/lib/itemImage";
import type { ImageSource, Item } from "@/lib/types";

/** Choix de l'image d'une pièce : photo officielle de la marque, détourée, packshot IA ou photo brute. */
export default function ImagePicker({ item, onChange }: { item: Item; onChange: (patch: Partial<Item>) => void }) {
  const [url, setUrl] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "lien" | "auto" | "ia">("");
  const [error, setError] = useState("");
  const current = displayImage(item)?.source;

  const sources: { s: ImageSource; src?: string }[] = [
    { s: "product", src: item.productImage },
    { s: "cutout", src: item.cutout },
    { s: "ai", src: item.aiImage },
    { s: "photo", src: item.photo },
  ];

  async function run(kind: "lien" | "auto" | "ia") {
    setBusy(kind); setError(""); setCandidates([]);
    try {
      if (kind === "ia") {
        const { image } = await apiFetch("/api/packshot", item.photo
          ? { photo: item.photo }
          : { description: `${item.name}, ${item.colors.map((c) => c.name).join(" et ")}, ${item.material}, ${item.fit}${item.brand ? `, style ${item.brand}` : ""}` });
        onChange({ aiImage: await toWhiteJpeg(image), imageSource: "ai" });
      } else {
        const res = await apiFetch("/api/product-image", kind === "lien"
          ? { url }
          : { brand: item.brand || item.store, name: item.name, color: item.colors[0]?.name });
        setCandidates(res.images);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-3">
      <span className="label">Image de la pièce</span>
      <div className="flex flex-wrap gap-2">
        {sources.filter((x) => x.src).map(({ s, src }) => (
          <button key={s} type="button" onClick={() => onChange({ imageSource: s })}
            className={`w-16 text-center text-[10px] leading-tight ${current === s ? "text-ink" : "text-muted"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" referrerPolicy="no-referrer" className={`mb-1 h-16 w-16 rounded-lg border-2 bg-white object-contain ${current === s ? "border-ink" : "border-line"}`} />
            {SOURCE_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-xl bg-paper p-3">
        <p className="text-xs font-medium">Photo officielle de la marque (sans mannequin)</p>
        <div className="flex gap-2">
          <input className="input py-1.5 text-xs" placeholder="Colle le lien de la page produit (Zara, Uniqlo, Zalando…)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="btn-ghost shrink-0 px-3 py-1.5 text-xs" disabled={!url || !!busy} onClick={() => run("lien")}>{busy === "lien" ? "…" : "OK"}</button>
        </div>
        <button type="button" className="text-xs text-muted underline" disabled={!!busy} onClick={() => run("auto")}>
          {busy === "auto" ? "Recherche…" : "🔎 Chercher automatiquement"}
        </button>
        {candidates.length > 0 && (
          <>
            <p className="text-[11px] text-muted">Touche la photo où la pièce est seule (packshot) :</p>
            <div className="grid grid-cols-4 gap-1.5">
              {candidates.map((c) => (
                <button key={c} type="button" onClick={() => { onChange({ productImage: c, imageSource: "product" }); setCandidates([]); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c} alt="" referrerPolicy="no-referrer" className="aspect-square w-full rounded-lg border border-line bg-white object-contain hover:border-ink" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button type="button" className="btn-ghost w-full text-xs" disabled={!!busy} onClick={() => run("ia")}>
        {busy === "ia" ? "Création du packshot…" : `✨ Générer un packshot IA ${item.photo ? "depuis ma photo" : "depuis la description"}`}
      </button>
      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}
