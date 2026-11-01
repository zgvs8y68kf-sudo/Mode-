"use client";

import { useRef, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { compressImage } from "@/lib/image";
import { newId } from "@/lib/store";
import { CATEGORIES, type Category, type Item, type ItemColor } from "@/lib/types";

interface ReceiptLine {
  rawLabel: string;
  reference?: string;
  quantity: number;
  price: number;
  size: string;
  colorConfidence: "lue" | "déduite" | "inconnue";
  name: string;
  category: Category;
  subtype: string;
  colors: ItemColor[];
  pattern: string;
  material: string;
  fit: string;
  formality: number;
  warmth: number;
  seasons: string[];
  styleTags: string[];
  brand?: string;
}

interface Receipt {
  isReceipt: boolean;
  store: string;
  date: string;
  currency: string;
  items: ReceiptLine[];
  note: string;
}

type Row = ReceiptLine & { key: string; keep: boolean };

export default function ReceiptScan({ onClose, onAdd }: { onClose: () => void; onAdd: (items: Item[]) => void }) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const input = useRef<HTMLInputElement>(null);

  async function pick(files: FileList | null) {
    if (!files) return;
    const imgs = await Promise.all(Array.from(files).slice(0, 4 - pages.length).map((f) => compressImage(f, 1600, 0.85)));
    setPages((p) => [...p, ...imgs].slice(0, 4));
    if (input.current) input.current.value = "";
  }

  async function read() {
    setLoading(true); setError("");
    try {
      const r: Receipt = await apiFetch("/api/receipt", { images: pages });
      if (!r.isReceipt) throw new Error("Ce n'est pas un ticket lisible. Reprends la photo bien à plat, sans reflet, ticket entier.");
      if (!r.items.length) throw new Error(r.note || "Aucun article de mode trouvé sur ce ticket.");
      setReceipt(r);
      setRows(r.items.map((it) => ({ ...it, key: newId(), keep: true })));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const edit = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function add() {
    const now = new Date().toISOString();
    const items: Item[] = rows.filter((r) => r.keep).flatMap((r) =>
      Array.from({ length: Math.max(1, r.quantity) }, (): Item => ({
        id: newId(),
        name: r.name,
        category: r.category,
        subtype: r.subtype,
        colors: r.colors,
        pattern: r.pattern,
        material: r.material,
        fit: r.fit,
        formality: r.formality,
        warmth: r.warmth,
        seasons: r.seasons,
        styleTags: r.styleTags,
        brand: r.brand || receipt?.store,
        size: r.size || undefined,
        price: r.price || undefined,
        purchaseDate: receipt?.date || undefined,
        store: receipt?.store,
        source: "ticket",
        wornCount: 0,
        createdAt: now,
      })),
    );
    onAdd(items);
    onClose();
  }

  const count = rows.filter((r) => r.keep).reduce((n, r) => n + Math.max(1, r.quantity), 0);

  return (
    <div className="fixed inset-0 z-30 grid place-items-end bg-ink/40 sm:place-items-center" onClick={onClose}>
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 sm:max-w-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl">🧾 Scanner un ticket</h2>
            <p className="text-sm text-muted">Ticket de caisse, facture ou capture d&apos;e-mail de commande. Jusqu&apos;à 4 photos pour un long ticket.</p>
          </div>
          <button className="text-xl text-muted" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        {!receipt && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {pages.map((p, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="" className="h-28 w-20 rounded-lg border border-line object-cover" />
                  <button className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-ink text-xs text-card" onClick={() => setPages((ps) => ps.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              {pages.length < 4 && (
                <button className="grid h-28 w-20 place-items-center rounded-lg border border-dashed border-line text-2xl text-muted hover:border-ink" onClick={() => input.current?.click()}>+</button>
              )}
              <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
            </div>
            <p className="text-xs text-muted">📸 Ticket bien à plat, entier, sans reflet. Les tickets thermiques s&apos;effacent avec le temps : scanne-les vite !</p>
            <button className="btn" disabled={!pages.length || loading} onClick={read}>{loading ? "Lecture du ticket…" : "Lire le ticket ✦"}</button>
            {error && <p className="text-sm text-accent">{error}</p>}
          </div>
        )}

        {receipt && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">
              <b>{receipt.store}</b>{receipt.date && ` · ${new Date(receipt.date).toLocaleDateString("fr-FR")}`} · {rows.length} article{rows.length > 1 ? "s" : ""} trouvé{rows.length > 1 ? "s" : ""}
            </p>
            {receipt.note && <p className="text-xs text-muted">{receipt.note}</p>}

            {rows.map((r) => (
              <div key={r.key} className={`space-y-2 rounded-xl border p-3 ${r.keep ? "border-line" : "border-line opacity-50"}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-2" checked={r.keep} onChange={(e) => edit(r.key, { keep: e.target.checked })} />
                  <label className="relative">
                    <input type="color" value={r.colors[0]?.hex ?? "#cccccc"} className="h-12 w-12 cursor-pointer rounded-lg"
                      onChange={(e) => edit(r.key, { colors: [{ hex: e.target.value, name: r.colors[0]?.name ?? "" }, ...r.colors.slice(1)], colorConfidence: "lue" })} />
                  </label>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <input className="input py-1.5" value={r.name} onChange={(e) => edit(r.key, { name: e.target.value })} />
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <select className="input w-auto py-1 text-xs capitalize" value={r.category} onChange={(e) => edit(r.key, { category: e.target.value as Category })}>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <input className="input w-28 py-1 text-xs" value={r.colors[0]?.name ?? ""} placeholder="couleur"
                        onChange={(e) => edit(r.key, { colors: [{ hex: r.colors[0]?.hex ?? "#cccccc", name: e.target.value }, ...r.colors.slice(1)] })} />
                      {r.size && <span className="rounded-full bg-paper px-2 py-1">T. {r.size}</span>}
                      <span className="rounded-full bg-paper px-2 py-1">{r.price?.toFixed(2)} {receipt.currency || "€"}{r.quantity > 1 ? ` ×${r.quantity}` : ""}</span>
                    </div>
                  </div>
                </div>
                <p className="pl-7 text-[11px] text-muted">
                  Ticket : « {r.rawLabel} »
                  {r.colorConfidence !== "lue" && <span className="ml-1 text-accent">· couleur {r.colorConfidence}, à vérifier</span>}
                </p>
              </div>
            ))}

            <p className="text-xs text-muted">Astuce : ajoute ensuite une photo de chaque pièce depuis ton dressing pour que l&apos;IA affine couleurs et coupe.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => { setReceipt(null); setRows([]); }}>Recommencer</button>
              <button className="btn" disabled={!count} onClick={add}>Ajouter {count} pièce{count > 1 ? "s" : ""}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
