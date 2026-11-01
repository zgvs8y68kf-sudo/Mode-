"use client";

import { useRef, useState } from "react";
import ItemThumb from "@/components/ItemThumb";
import ReceiptScan from "@/components/ReceiptScan";
import ImagePicker from "@/components/ImagePicker";
import { makeCutout } from "@/lib/cutout";
import Empty from "@/components/Empty";
import { compressImage } from "@/lib/image";
import { apiFetch } from "@/lib/apiFetch";
import { newId, useItems, useProfile } from "@/lib/store";
import { CATEGORIES, type Category, type Item } from "@/lib/types";

type Pending = { key: string; photo: string; status: "analyse" | "erreur"; error?: string };

export default function DressingPage() {
  const [items, setItems, ready] = useItems();
  const [profile] = useProfile();
  const [filter, setFilter] = useState<Category | "tout">("tout");
  const [pending, setPending] = useState<Pending[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [scanning, setScanning] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const key = newId();
      const photo = await compressImage(file);
      setPending((p) => [...p, { key, photo, status: "analyse" }]);
      try {
        const { outline, ...data } = await apiFetch("/api/analyze-item", { photo });
        const cutout = await makeCutout(photo, outline ?? []).catch(() => undefined);
        const item: Item = { ...data, id: newId(), photo, cutout, source: "photo", wornCount: 0, createdAt: new Date().toISOString() };
        setItems((xs) => [item, ...xs]);
        setPending((p) => p.filter((x) => x.key !== key));
      } catch (e) {
        setPending((p) => p.map((x) => (x.key === key ? { ...x, status: "erreur", error: String((e as Error).message) } : x)));
      }
    }
    if (input.current) input.current.value = "";
  }

  if (!ready) return null;
  if (!profile)
    return <Empty title="Commence par ton profil" text="Quelques infos sur toi pour que les conseils soient vraiment personnalisés." href="/profil" cta="Créer mon profil" />;

  const shown = filter === "tout" ? items : items.filter((i) => i.category === filter);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, items.filter((i) => i.category === c).length]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Mon dressing</h1>
          <p className="text-sm text-muted">{items.length} pièce{items.length > 1 ? "s" : ""} numérisée{items.length > 1 ? "s" : ""}. Photographie chaque pièce à plat ou sur cintre, en lumière naturelle.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => setScanning(true)}>🧾 Scanner un ticket</button>
          <button className="btn" onClick={() => input.current?.click()}>+ Ajouter des pièces</button>
        </div>
        <input ref={input} type="file" accept="image/*" multiple capture="environment" hidden onChange={(e) => addPhotos(e.target.files)} />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className={`chip shrink-0 ${filter === "tout" ? "chip-on" : ""}`} onClick={() => setFilter("tout")}>Tout · {items.length}</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip shrink-0 capitalize ${filter === c ? "chip-on" : ""}`} onClick={() => setFilter(c)}>
            {c} · {counts[c]}
          </button>
        ))}
      </div>

      {items.length === 0 && pending.length === 0 && (
        <div className="card py-12 text-center">
          <p className="font-serif text-xl">Ton dressing est vide</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Ajoute tes pièces en photo, ou scanne directement un ticket de caisse. L&apos;IA reconnaît le type, les couleurs exactes, la matière, la coupe et le niveau de formalité.
            Commence par 10 essentiels (hauts, bas, chaussures, une veste).
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {pending.map((p) => (
          <div key={p.key} className="space-y-1.5">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} alt="" className="h-full w-full object-cover opacity-50" />
              <span className="absolute inset-0 grid place-items-center text-xs font-medium">
                {p.status === "analyse" ? "Analyse IA…" : "Erreur"}
              </span>
            </div>
            {p.status === "erreur" && (
              <p className="text-xs text-accent">
                {p.error}{" "}
                <button className="underline" onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))}>retirer</button>
              </p>
            )}
          </div>
        ))}
        {shown.map((i) => (
          <button key={i.id} className="space-y-1.5 text-left" onClick={() => setEditing(i)}>
            <ItemThumb item={i} />
            <p className="line-clamp-1 text-sm font-medium">{i.name}</p>
            <p className="text-xs text-muted">{i.colors.map((c) => c.name).join(" · ")} {i.wornCount ? `· porté ${i.wornCount}×` : ""}</p>
          </button>
        ))}
      </div>

      {scanning && <ReceiptScan onClose={() => setScanning(false)} onAdd={(news) => setItems((xs) => [...news, ...xs])} />}

      {editing && (
        <EditItem
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(it) => { setItems((xs) => xs.map((x) => (x.id === it.id ? it : x))); setEditing(null); }}
          onDelete={() => { setItems((xs) => xs.filter((x) => x.id !== editing.id)); setEditing(null); }}
        />
      )}
    </div>
  );
}

function EditItem({ item, onClose, onSave, onDelete }: { item: Item; onClose: () => void; onSave: (i: Item) => void; onDelete: () => void }) {
  const [it, setIt] = useState(item);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);

  // Ajout / remplacement de photo : l'IA affine couleurs, matière et coupe, on garde nom, prix, taille…
  async function addPhoto(file: File) {
    setBusy(true); setErr("");
    try {
      const photo = await compressImage(file);
      const a = await apiFetch("/api/analyze-item", { photo });
      const cutout = await makeCutout(photo, a.outline ?? []).catch(() => undefined);
      setIt((x) => ({ ...x, photo, cutout, imageSource: undefined, colors: a.colors, pattern: a.pattern, material: a.material, fit: a.fit }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-30 grid place-items-end bg-ink/40 sm:place-items-center" onClick={onClose}>
      <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 sm:max-w-md sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-4">
          <div className="w-28 shrink-0 space-y-1">
            <ItemThumb item={it} />
            <button className="w-full text-xs text-muted underline" disabled={busy} onClick={() => photoInput.current?.click()}>
              {busy ? "Analyse…" : it.photo ? "Changer la photo" : "📷 Ajouter une photo"}
            </button>
            <input ref={photoInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && addPhoto(e.target.files[0])} />
          </div>
          <div className="flex-1 space-y-2">
            <input className="input" value={it.name} onChange={(e) => setIt({ ...it, name: e.target.value })} />
            <select className="input capitalize" value={it.category} onChange={(e) => setIt({ ...it, category: e.target.value as Category })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <ImagePicker item={it} onChange={(patch) => setIt((x) => ({ ...x, ...patch }))} />
          <div>
            <span className="label">Couleurs</span>
            <div className="flex flex-wrap gap-3">
              {it.colors.map((c, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input type="color" value={c.hex} className="h-8 w-8 cursor-pointer rounded-full"
                    onChange={(e) => setIt({ ...it, colors: it.colors.map((x, j) => (j === idx ? { ...x, hex: e.target.value } : x)) })} />
                  <input className="input w-28 py-1" value={c.name}
                    onChange={(e) => setIt({ ...it, colors: it.colors.map((x, j) => (j === idx ? { ...x, name: e.target.value } : x)) })} />
                </label>
              ))}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-muted">Type</dt><dd>{it.subtype}</dd></div>
            <div><dt className="text-muted">Coupe</dt><dd>{it.fit}</dd></div>
            <div><dt className="text-muted">Matière</dt><dd>{it.material}</dd></div>
            <div><dt className="text-muted">Motif</dt><dd>{it.pattern}</dd></div>
            <div><dt className="text-muted">Formalité</dt><dd>{"●".repeat(it.formality)}{"○".repeat(5 - it.formality)}</dd></div>
            <div><dt className="text-muted">Chaleur</dt><dd>{"●".repeat(it.warmth)}{"○".repeat(5 - it.warmth)}</dd></div>
            {(it.store || it.price || it.size) && (
              <div className="col-span-2"><dt className="text-muted">Achat</dt>
                <dd>
                  {[it.store, it.size && `T. ${it.size}`, it.price && `${it.price.toFixed(2)} €`, it.purchaseDate && new Date(it.purchaseDate).toLocaleDateString("fr-FR")].filter(Boolean).join(" · ")}
                  {it.price ? ` · coût par port : ${(it.price / Math.max(1, it.wornCount)).toFixed(2)} €` : ""}
                </dd>
              </div>
            )}
            <div className="col-span-2"><dt className="text-muted">Saisons · style</dt><dd>{it.seasons.join(", ")} · {it.styleTags.join(", ")}</dd></div>
          </dl>
        </div>
        {err && <p className="mt-3 text-sm text-accent">{err}</p>}
        <div className="mt-5 flex justify-between">
          <button className="text-sm text-accent underline" onClick={() => confirm("Supprimer cette pièce ?") && onDelete()}>Supprimer</button>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn" onClick={() => onSave(it)}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
