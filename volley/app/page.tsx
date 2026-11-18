"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import PresencePicker from "@/components/PresencePicker";
import { formatDate, formatTime, plural, relativeDay } from "@/lib/format";
import { addDemoPlayers, createSession, isoDate, resetLocal, setPresence, subscribeSessions } from "@/lib/store";
import type { Session } from "@/lib/types";

export default function SeancesPage() {
  const { uid, me, enabled, playersLoaded, players } = useApp();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => (uid ? subscribeSessions(setSessions) : undefined), [uid]);

  if (!uid || !playersLoaded || !sessions) return <p className="pt-10 text-center text-sm text-muted">Chargement…</p>;

  const last = sessions.at(-1);
  const demoCount = Object.keys(players).filter((id) => id.startsWith("demo-")).length;

  return (
    <div className="space-y-6">
      {!enabled && (
        <div className="rounded-2xl border border-dashed border-maybe bg-maybe-soft p-4 text-sm text-maybe">
          <b>Mode démo :</b> Firebase n'est pas configuré, les données restent dans ce navigateur.{" "}
          <button className="underline" onClick={() => addDemoPlayers()}>{demoCount ? "Réinscrire" : "Ajouter"} 14 joueurs fictifs à la prochaine séance</button>
          {" · "}
          <button className="underline" onClick={() => confirm("Effacer toutes les données de démo ?") && resetLocal()}>Tout effacer</button>
        </div>
      )}

      {!me && (
        <Link href="/profil" className="card block border-accent bg-accent-soft transition hover:shadow-md">
          <p className="text-lg font-extrabold" style={{ fontFamily: "var(--font-display)" }}>👋 Commence par ton profil</p>
          <p className="mt-1 text-sm text-muted">Un petit questionnaire de 2 minutes pour que les équipes soient équilibrées. Ensuite tu n'auras plus qu'à dire si tu viens.</p>
          <span className="btn-accent mt-3">Remplir mon profil →</span>
        </Link>
      )}

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Séances</h1>
          <p className="text-sm text-muted">Dis si tu viens, l'app s'occupe des équipes.</p>
        </div>
        {!creating && <button className="btn" onClick={() => setCreating(true)}>+ Séance</button>}
      </div>

      {creating && (
        <NewSession uid={uid} defaults={last} onClose={() => setCreating(false)} />
      )}

      {sessions.length === 0 && !creating && (
        <div className="card text-center text-sm text-muted">
          Aucune séance prévue. <button className="font-semibold text-ink underline" onClick={() => setCreating(true)}>Créer la prochaine</button>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((s) => {
          const counts = { yes: 0, maybe: 0, no: 0 };
          for (const p of Object.values(s.presence)) counts[p]++;
          const guests = Object.keys(s.guests).length;
          const rel = relativeDay(s.date);
          return (
            <div key={s.id} className={`card space-y-3 ${rel === "Passée" ? "opacity-60" : ""}`}>
              <Link href={`/seance/${s.id}`} className="flex items-start justify-between gap-3">
                <div>
                  {rel && <span className="mb-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent">{rel}</span>}
                  <h2 className="text-lg leading-tight">{formatDate(s.date)}{s.time && ` · ${formatTime(s.time)}`}</h2>
                  {s.place && <p className="text-sm text-muted">📍 {s.place}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-extrabold text-ok" style={{ fontFamily: "var(--font-display)" }}>{counts.yes + guests}</p>
                  <p className="text-[11px] text-muted">présent·e·s{counts.maybe ? ` · ${counts.maybe} ?` : ""}</p>
                </div>
              </Link>
              {me && rel !== "Passée" && (
                <PresencePicker value={s.presence[uid]} onChange={(p) => setPresence(s.id, uid, p)} />
              )}
              <Link href={`/seance/${s.id}`} className="block text-sm font-semibold text-accent">
                {s.teams ? `Voir les ${plural(s.teams.groups.length, "équipe")} →` : "Présents et équipes →"}
              </Link>
            </div>
          );
        })}
      </div>
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
    <form className="card space-y-3" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      try { await createSession({ date, time, place: place.trim() }, uid); onClose(); } finally { setBusy(false); }
    }}>
      <h2 className="text-lg">Nouvelle séance</h2>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="d">Date</label><input id="d" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label className="label" htmlFor="t">Heure</label><input id="t" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      </div>
      <div><label className="label" htmlFor="p">Lieu</label><input id="p" className="input" maxLength={80} placeholder="Ex. Gymnase Jean Moulin" value={place} onChange={(e) => setPlace(e.target.value)} /></div>
      <div className="flex gap-2">
        <button className="btn" disabled={busy || !date}>Créer</button>
        <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
      </div>
    </form>
  );
}
