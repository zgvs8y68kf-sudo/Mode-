"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import PresencePicker from "@/components/PresencePicker";
import { formatDate, formatTime, relativeDay } from "@/lib/format";
import { addDemoPlayers, createSession, isoDate, resetLocal, setPresence, subscribeSessions } from "@/lib/store";
import type { Session } from "@/lib/types";

const countOf = (s: Session) => Object.values(s.presence).filter((p) => p === "yes").length + Object.keys(s.guests).length;
const maybeOf = (s: Session) => Object.values(s.presence).filter((p) => p === "maybe").length;

export default function SeancesPage() {
  const { uid, me, enabled, playersLoaded, players } = useApp();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => (uid ? subscribeSessions(setSessions) : undefined), [uid]);

  if (!uid || !playersLoaded || !sessions) return <p className="display pt-10 text-center text-xl text-dim">Chargement…</p>;

  const upcoming = sessions.filter((s) => relativeDay(s.date) !== "Passée");
  const past = sessions.filter((s) => relativeDay(s.date) === "Passée");
  const [hero, ...others] = upcoming;
  const demoCount = Object.keys(players).filter((id) => id.startsWith("demo-")).length;

  return (
    <div className="space-y-6">
      {!enabled && (
        <div className="border border-dashed border-gold/60 bg-gold/10 p-3 text-base text-gold">
          <b className="uppercase tracking-wider">Mode démo</b> · données gardées dans ce navigateur.{" "}
          <button className="underline" onClick={() => addDemoPlayers()}>{demoCount ? "Réinscrire" : "Ajouter"} 14 joueurs fictifs à la prochaine séance</button>
          {" · "}
          <button className="underline" onClick={() => confirm("Effacer toutes les données de démo ?") && resetLocal()}>Tout effacer</button>
        </div>
      )}

      {!me && (
        <Link href="/profil" className="block border-2 border-gold bg-panel p-5 transition hover:bg-panel-2">
          <span className="kicker">Avant le coup d'envoi</span>
          <p className="display mt-1 text-4xl">Crée ton joueur</p>
          <p className="mt-1 text-lg text-muted">1 minute, ou 20 secondes en profil express. Ensuite tu n'as plus qu'à dire si tu viens.</p>
          <span className="btn-gold mt-4">C'est parti →</span>
        </Link>
      )}

      {hero ? <Hero s={hero} uid={uid} canAnswer={!!me} /> : !creating && (
        <div className="panel p-6 text-center">
          <p className="display text-3xl">Aucune séance prévue</p>
          <p className="mt-1 text-lg text-muted">Crée la prochaine pour lancer les inscriptions.</p>
          <button className="btn mt-4" onClick={() => setCreating(true)}>Nouvelle séance</button>
        </div>
      )}

      {creating && <NewSession uid={uid} defaults={sessions.at(-1)} onClose={() => setCreating(false)} />}

      {(others.length > 0 || hero) && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl">Calendrier</h2>
            <span className="h-0.5 flex-1 bg-line" />
            {!creating && <button className="display text-lg text-gold hover:text-ink" onClick={() => setCreating(true)}>+ Séance</button>}
          </div>
          {others.length === 0 && <p className="text-lg text-dim">Pas d'autre séance prévue pour l'instant.</p>}
          {others.map((s) => <Row key={s.id} s={s} uid={uid} canAnswer={!!me} />)}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-2 opacity-70">
          <h2 className="text-xl text-dim">Dernières séances</h2>
          {past.map((s) => (
            <Link key={s.id} href={`/seance/${s.id}`} className="panel flex items-center justify-between px-4 py-3 hover:border-ink">
              <span className="display text-lg">{formatDate(s.date)}</span>
              <span className="text-base text-muted">{countOf(s)} joueurs</span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function Hero({ s, uid, canAnswer }: { s: Session; uid: string; canAnswer: boolean }) {
  const rel = relativeDay(s.date);
  const n = countOf(s);
  const maybe = maybeOf(s);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {rel === "Aujourd'hui" ? (
          <span className="bg-red px-2 py-0.5 text-sm font-extrabold tracking-[0.12em]">CE SOIR</span>
        ) : (
          <span className="bg-panel-2 px-2 py-0.5 text-sm font-extrabold tracking-[0.12em] text-muted">PROCHAINE SÉANCE</span>
        )}
        <span className="text-base font-bold tracking-[0.12em] text-muted">
          {formatDate(s.date).toUpperCase()}{s.time && ` · ${formatTime(s.time).toUpperCase()}`}
        </span>
      </div>
      <div>
        {s.place && <span className="kicker">{s.place}</span>}
        <h1 className="mt-1 text-7xl">{rel === "Aujourd'hui" ? <>Match<br />night</> : rel === "Demain" ? <>C'est<br />demain</> : <>Prochain<br />match</>}</h1>
      </div>
      <Link href={`/seance/${s.id}`} className="flex items-stretch bg-ink text-bg transition hover:brightness-95">
        <span className="flex flex-col justify-center bg-gold px-4 py-2">
          <span className="display text-4xl leading-none">{n}</span>
          <span className="text-xs font-extrabold tracking-[0.1em]">PRÉSENTS</span>
        </span>
        <span className="flex flex-1 flex-col justify-center px-3 py-2">
          <span className="text-lg font-extrabold uppercase">{s.teams ? `${s.teams.groups.length} équipes prêtes` : n >= 4 ? "Équipes à faire" : "Inscriptions ouvertes"}</span>
          <span className="text-base font-semibold text-[#4a5266]">{maybe ? `${maybe} peut-être · ` : ""}Voir la feuille de match</span>
        </span>
        <span className="display flex items-center bg-red px-4 text-xl text-white">→</span>
      </Link>
      {canAnswer && <PresencePicker value={s.presence[uid]} onChange={(p) => setPresence(s.id, uid, p)} />}
    </section>
  );
}

function Row({ s, uid, canAnswer }: { s: Session; uid: string; canAnswer: boolean }) {
  return (
    <div className="panel space-y-3 p-4">
      <Link href={`/seance/${s.id}`} className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="display text-2xl">{formatDate(s.date)}{s.time && ` · ${formatTime(s.time)}`}</p>
          {s.place && <p className="truncate text-base font-semibold text-muted">{s.place}</p>}
        </div>
        <span className="flex flex-col items-center bg-panel-2 px-3 py-1">
          <span className="display text-2xl text-gold">{countOf(s)}</span>
          <span className="text-[11px] font-extrabold tracking-[0.1em] text-muted">PRÉSENTS</span>
        </span>
      </Link>
      {canAnswer && <PresencePicker value={s.presence[uid]} onChange={(p) => setPresence(s.id, uid, p)} />}
    </div>
  );
}

function NewSession({ uid, defaults, onClose }: { uid: string; defaults?: Session; onClose: () => void }) {
  // Par défaut : une semaine après la dernière séance, même heure et même lieu.
  const nextDate = () => {
    if (!defaults) return isoDate(new Date());
    const [y, m, d] = defaults.date.split("-").map(Number);
    const n = new Date(y, m - 1, d + 7);
    return isoDate(n < new Date() ? new Date() : n);
  };
  const [date, setDate] = useState(nextDate);
  const [time, setTime] = useState(defaults?.time ?? "20:00");
  const [place, setPlace] = useState(defaults?.place ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <form className="panel space-y-4 p-5" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      try { await createSession({ date, time, place: place.trim() }, uid); onClose(); } finally { setBusy(false); }
    }}>
      <h2 className="text-3xl">Nouvelle séance</h2>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="d">Date</label><input id="d" type="date" required className="input [color-scheme:dark]" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label className="label" htmlFor="t">Heure</label><input id="t" type="time" className="input [color-scheme:dark]" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      </div>
      <div><label className="label" htmlFor="p">Lieu</label><input id="p" className="input" maxLength={80} placeholder="Ex. Gymnase Jean Moulin" value={place} onChange={(e) => setPlace(e.target.value)} /></div>
      <div className="flex gap-2">
        <button className="btn" disabled={busy || !date}>Créer</button>
        <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
      </div>
    </form>
  );
}
