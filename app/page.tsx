"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import Empty from "@/components/Empty";
import ItemThumb from "@/components/ItemThumb";
import MissingCard from "@/components/MissingCard";
import { HARMONY_HELP, harmonyOf } from "@/lib/color";
import { useHistory, useItems, useProfile, wardrobeForAI } from "@/lib/store";
import { getWeather, weatherEmoji } from "@/lib/weather";
import { OCCASIONS, type Outfit, type Weather } from "@/lib/types";

export default function Today() {
  const [profile, , ready] = useProfile();
  const [items, setItems] = useItems();
  const [history, setHistory] = useHistory();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [occasion, setOccasion] = useState("quotidien");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ weatherAdvice: string; outfits: Outfit[] } | null>(null);
  const [worn, setWorn] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    getWeather({ city: profile.city }).then(setWeather).catch(() => setWeather(null));
  }, [profile]);

  function locate() {
    navigator.geolocation?.getCurrentPosition((pos) =>
      getWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }).then(setWeather),
    );
  }

  async function generate() {
    setLoading(true); setError(""); setResult(null); setWorn(null);
    try {
      const occ = OCCASIONS.find((o) => o.id === occasion)?.label ?? occasion;
      const r = await fetch("/api/outfit", {
        method: "POST",
        body: JSON.stringify({ profile, wardrobe: wardrobeForAI(items), weather, occasion: occ, note, recent: history.slice(0, 7) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function wear(idx: number, o: Outfit) {
    const today = new Date().toISOString();
    setHistory((h) => [{ date: today, itemIds: o.itemIds, occasion }, ...h].slice(0, 60));
    setItems((xs) => xs.map((x) => (o.itemIds.includes(x.id) ? { ...x, wornCount: x.wornCount + 1, lastWorn: today } : x)));
    setWorn(idx);
  }

  if (!ready) return null;
  if (!profile)
    return (
      <div className="space-y-10">
        <section className="grid items-center gap-8 py-6 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Ton styliste IA</p>
            <h1 className="mt-3 text-5xl leading-[1.05] sm:text-6xl">Bien s&apos;habiller,<br />sans se prendre la tête.</h1>
            <p className="mt-4 max-w-md text-muted">
              Numérise ta garde-robe en photo. Chaque matin, reçois la tenue complète qui va avec la météo, ton programme,
              ta morphologie et tes couleurs. Et découvre la pièce qui manque vraiment.
            </p>
            <Link href="/profil" className="btn mt-6">Créer mon profil — 2 min</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["1", "Ton profil", "Morphologie, carnation, style"], ["2", "Ton dressing", "Une photo par pièce, l'IA fait le reste"], ["3", "Ta tenue", "Météo + occasion = la bonne tenue"]].map(([n, t, d]) => (
              <div key={n} className="card p-4">
                <p className="font-serif text-3xl text-accent">{n}</p>
                <p className="mt-2 text-sm font-medium">{t}</p>
                <p className="text-xs text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );

  const byId = new Map(items.map((i) => [i.id, i]));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="card flex items-center gap-4">
          <Avatar profile={profile} size={110} />
          <div className="flex-1">
            <p className="text-sm text-muted">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-3xl">Bonjour {profile.name || ""} 👋</h1>
            {weather ? (
              <p className="mt-1 text-sm">
                {weatherEmoji(weather.code)} {weather.city} · {weather.label} · <b>{weather.tempMin}° → {weather.tempMax}°</b>{" "}
                <span className="text-muted">(ressenti {weather.feelsLike}°, pluie {weather.precipProb}%, vent {weather.wind} km/h)</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">Météo indisponible.</p>
            )}
            <button onClick={locate} className="mt-1 text-xs text-muted underline">Utiliser ma position</button>
          </div>
        </div>
      </section>

      {items.length < 3 ? (
        <Empty title="Ajoute quelques pièces" text="Il faut au moins un haut, un bas et une paire de chaussures pour composer une tenue." href="/dressing" cta="Numériser mon dressing" />
      ) : (
        <section className="card space-y-4">
          <span className="label">Aujourd&apos;hui, c&apos;est pour…</span>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <button key={o.id} className={`chip ${occasion === o.id ? "chip-on" : ""}`} onClick={() => setOccasion(o.id)}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Précision (facultatif) : dîner en terrasse, je marche beaucoup, dress code « chic décontracté »…" />
          <button className="btn" disabled={loading} onClick={generate}>
            {loading ? "Ton styliste réfléchit…" : result ? "Proposer d'autres tenues" : "Habille-moi ✦"}
          </button>
          {error && <p className="text-sm text-accent">{error}</p>}
        </section>
      )}

      {result && (
        <section className="space-y-4">
          <p className="text-sm text-muted">{result.weatherAdvice}</p>
          {result.outfits.map((o, idx) => {
            const its = o.itemIds.map((id) => byId.get(id)).filter((x) => !!x);
            const harmony = harmonyOf([...its.flatMap((i) => i.colors.map((c) => c.hex)), ...o.missing.map((m) => m.colorHex)]);
            return (
              <article key={idx} className="card space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl">{o.title}</h2>
                  <span className="rounded-full bg-paper px-3 py-1 text-xs" title={HARMONY_HELP[harmony]}>◐ {harmony}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {its.map((i) => (
                    <div key={i.id} className="w-20 space-y-1">
                      <ItemThumb item={i} size="sm" />
                      <p className="line-clamp-2 text-[11px] leading-tight text-muted">{i.name}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm">{o.why}</p>
                <p className="text-sm text-muted"><b className="text-ink">Couleurs :</b> {o.colorStory}</p>
                <p className="text-sm text-muted"><b className="text-ink">Astuce :</b> {o.tip}</p>
                {o.missing.map((m, j) => <MissingCard key={j} piece={m} preferred={profile.shops} />)}
                <button className={worn === idx ? "btn-ghost" : "btn"} disabled={worn !== null} onClick={() => wear(idx, o)}>
                  {worn === idx ? "✓ C'est noté, belle journée !" : "Je porte celle-ci"}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
