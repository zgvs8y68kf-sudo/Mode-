"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import PresencePicker from "@/components/PresencePicker";
import { formatDate, formatTime, plural, relativeDay } from "@/lib/format";
import { GUEST_LEVELS, guestToMember, playerToMember, toRating } from "@/lib/questionnaire";
import { addGuest, deleteSession, removeGuest, saveTeams, setPresence, subscribeSession } from "@/lib/store";
import { makeTeams, suggestedTeamCount, teamStats } from "@/lib/teams";
import type { Member, Session, Sex } from "@/lib/types";

const TEAMS = [
  { name: "Titans", color: "#f5b700", emoji: "🟡" },
  { name: "Phénix", color: "#e63946", emoji: "🔴" },
  { name: "Cobras", color: "#3d7bff", emoji: "🔵" },
  { name: "Requins", color: "#2bd47d", emoji: "🟢" },
  { name: "Lynx", color: "#a46bff", emoji: "🟣" },
  { name: "Comètes", color: "#ffffff", emoji: "⚪" },
];

/** Ordre de passage : les équipes jouent deux par deux, la dernière attend si elles sont en nombre impair. */
function fixtures(n: number): string {
  const parts: string[] = [];
  for (let i = 0; i + 1 < n; i += 2) parts.push(`${TEAMS[i].name} contre ${TEAMS[i + 1].name}`);
  if (n % 2) parts.push(`${TEAMS[n - 1].name} en attente`);
  return parts.join(" · ");
}

export default function SeancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { uid, me, players, playersLoaded } = useApp();
  const [s, setS] = useState<Session | null | undefined>(undefined);
  const [k, setK] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => (uid ? subscribeSession(id, setS) : undefined), [uid, id]);

  // Présents = joueurs ayant répondu « Je viens » + invités.
  const present: Member[] = useMemo(() => {
    if (!s) return [];
    const ps = Object.entries(s.presence).filter(([, p]) => p === "yes").map(([pid]) => players[pid]).filter(Boolean).map(playerToMember);
    const gs = Object.values(s.guests).map(guestToMember);
    return [...ps, ...gs].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [s, players]);

  if (s === undefined || !uid || !playersLoaded) return <p className="display pt-10 text-center text-xl text-dim">Chargement…</p>;
  if (s === null)
    return (
      <div className="panel p-6 text-center">
        <p className="display text-3xl">Séance introuvable</p>
        <Link href="/" className="btn-ghost mt-4">Retour aux séances</Link>
      </div>
    );

  const byId = new Map(present.map((m) => [m.id, m]));
  const names = (st: "maybe" | "no") =>
    Object.entries(s.presence).filter(([, p]) => p === st).map(([pid]) => players[pid]?.name).filter(Boolean) as string[];
  const noAnswer = Object.values(players).filter((p) => !s.presence[p.id] && !p.id.startsWith("demo-")).map((p) => p.name);
  const nbTeams = k ?? (s.teams?.groups.length || suggestedTeamCount(present.length));
  const maxTeams = Math.max(2, Math.min(TEAMS.length, Math.floor(present.length / 2)));

  const teamIds = new Set(s.teams?.groups.flat() ?? []);
  const stale = !!s.teams && (teamIds.size !== present.length || present.some((m) => !teamIds.has(m.id)));
  const teams: Member[][] = s.teams ? s.teams.groups.map((g) => g.map((mid) => byId.get(mid)).filter((m): m is Member => !!m)) : [];
  const ratings = teams.map((t) => toRating(teamStats(t).level));
  const gap = ratings.length ? Math.max(...ratings) - Math.min(...ratings) : 0;
  const rel = relativeDay(s.date);

  async function generate() {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 20)); // laisse le bouton se mettre à jour avant le calcul
    try {
      const groups = makeTeams(present, nbTeams).map((t) => t.map((m) => m.id));
      await saveTeams(s!.id, { at: Date.now(), by: uid!, groups });
    } finally { setBusy(false); }
  }

  async function copy() {
    const lines = [`🏐 ${formatDate(s!.date)}${s!.time ? " · " + formatTime(s!.time) : ""}${s!.place ? " · " + s!.place : ""}`, ""];
    teams.forEach((t, i) => lines.push(`${TEAMS[i].emoji} ${TEAMS[i].name} (${ratings[i]}) : ${t.map((m) => m.name).join(", ")}`));
    lines.push("", `Ordre de passage : ${fixtures(teams.length)}`);
    const text = lines.join("\n");
    try { await navigator.clipboard.writeText(text); } catch { return prompt("Copie ce texte :", text); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-base font-bold uppercase tracking-wider text-dim hover:text-ink">← Séances</Link>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {rel === "Aujourd'hui" && <span className="bg-red px-2 py-0.5 text-sm font-extrabold tracking-[0.12em]">CE SOIR</span>}
          {rel === "Passée" && <span className="bg-panel-2 px-2 py-0.5 text-sm font-extrabold tracking-[0.12em] text-muted">TERMINÉE</span>}
          <span className="text-base font-bold tracking-[0.12em] text-muted">
            {formatDate(s.date).toUpperCase()}{s.time && ` · ${formatTime(s.time).toUpperCase()}`}
          </span>
        </div>
        <div>
          {s.place && <span className="kicker">{s.place}</span>}
          <h1 className="mt-1 text-7xl">Feuille<br />de match</h1>
        </div>
        <div className="flex items-stretch bg-ink text-bg">
          <span className="flex flex-col justify-center bg-gold px-4 py-2">
            <span className="display text-4xl leading-none">{present.length}</span>
            <span className="text-xs font-extrabold tracking-[0.1em]">PRÉSENTS</span>
          </span>
          <span className="flex flex-1 flex-col justify-center px-3 py-2">
            <span className="text-lg font-extrabold uppercase">
              {teams.length ? `${teams.length} équipes · ${Math.floor(present.length / teams.length)}${present.length % teams.length ? `-${Math.ceil(present.length / teams.length)}` : ""} joueurs` : "Équipes pas encore tirées"}
            </span>
            <span className="text-base font-semibold text-[#4a5266]">
              {teams.length ? `Écart de niveau : ${gap} pt${gap > 1 ? "s" : ""}` : names("maybe").length ? `${names("maybe").length} peut-être` : "En attente des inscriptions"}
            </span>
          </span>
        </div>
        {me ? (
          rel !== "Passée" && <PresencePicker value={s.presence[uid]} onChange={(p) => setPresence(s.id, uid, p)} />
        ) : (
          <Link href="/profil" className="btn-gold w-full">Crée ton joueur pour t'inscrire</Link>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl">Les équipes</h2>
          <span className="h-0.5 flex-1 bg-line" />
          {teams.length > 0 && <span className="text-sm font-extrabold tracking-[0.12em] text-muted">NIV.</span>}
        </div>

        {stale && <p className="border-l-4 border-gold bg-panel px-3 py-2.5 text-lg text-gold">La liste des présents a changé : refais le tirage pour inclure tout le monde.</p>}

        {teams.length > 0 && (
          <div className="space-y-2.5">
            {teams.map((t, i) => {
              const st = teamStats(t);
              return (
                <div key={i} className="grid grid-cols-[6px_minmax(0,1fr)_68px] bg-gradient-to-r from-panel-2 to-panel">
                  <span style={{ background: TEAMS[i].color }} />
                  <div className="min-w-0 px-3 py-2.5">
                    <p className="display text-2xl">{TEAMS[i].name}</p>
                    <p className="text-lg font-semibold text-muted">
                      {t.map((m, j) => <span key={m.id}>{j > 0 && " · "}{m.name}{m.guest && <span className="text-dim">*</span>}</span>)}
                    </p>
                    <p className="mt-1 text-sm font-bold tracking-[0.08em] text-dim">
                      {st.women} F · {st.men} H{st.age !== null && ` · ~${st.age} ANS`}
                    </p>
                  </div>
                  <span className="display flex items-center justify-center bg-panel-2 text-4xl text-gold">{ratings[i]}</span>
                </div>
              );
            })}
            {teams.some((t) => t.some((m) => m.guest)) && <p className="text-base text-dim">* invité·e</p>}
            <p className="flex flex-wrap gap-x-2 border-t border-line pt-3 text-lg font-bold">
              <span className="text-gold">ORDRE DE PASSAGE</span><span className="text-muted">{fixtures(teams.length)}</span>
            </p>
          </div>
        )}

        {present.length < 4 ? (
          <p className="text-lg text-dim">Il faut au moins 4 présents pour tirer les équipes.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="label">Nombre d'équipes</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: maxTeams - 1 }, (_, i) => i + 2).map((n) => (
                  <button key={n} className={`chip ${nbTeams === n ? "chip-on" : ""}`} onClick={() => setK(n)}>
                    {n} <span className="opacity-70">· {Math.floor(present.length / n)}{present.length % n ? `-${Math.ceil(present.length / n)}` : ""} joueurs</span>
                  </button>
                ))}
              </div>
            </div>
            <button className={s.teams ? "btn-ghost w-full" : "btn w-full"} disabled={busy} onClick={generate}>
              {busy ? "Tirage…" : s.teams ? "Nouveau tirage" : "Tirer les équipes"}
            </button>
            {teams.length > 0 && <button className="btn-gold w-full" onClick={copy}>{copied ? "Copié !" : "Copier pour le groupe WhatsApp"}</button>}
          </div>
        )}
      </section>

      <section className="panel space-y-3 p-4">
        <h2 className="text-2xl">Effectif</h2>
        {present.length === 0 ? <p className="text-lg text-dim">Personne pour l'instant.</p> : (
          <div className="flex flex-wrap gap-1.5">
            {present.map((m) => (
              <span key={m.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-lg font-semibold ${m.guest ? "border border-dashed border-line text-muted" : "bg-panel-2"}`}>
                {m.name}
                {m.guest && <>
                  <span className="text-xs font-bold tracking-wider text-dim">INVITÉ</span>
                  <button aria-label={`Retirer ${m.name}`} className="text-dim hover:text-red" onClick={() => removeGuest(s.id, m.id.slice(6))}>×</button>
                </>}
              </span>
            ))}
          </div>
        )}
        {names("maybe").length > 0 && <p className="text-lg"><b className="text-gold">Peut-être :</b> {names("maybe").join(", ")}</p>}
        {names("no").length > 0 && <p className="text-lg text-muted"><b>Absents :</b> {names("no").join(", ")}</p>}
        {noAnswer.length > 0 && <p className="text-lg text-muted"><b>Pas encore répondu :</b> {noAnswer.join(", ")}</p>}
        <GuestForm onAdd={(name, sex, level) => addGuest(s.id, { id: Math.random().toString(36).slice(2, 9), name, sex, level, addedBy: uid })} />
      </section>

      {s.createdBy === uid && (
        <div className="text-center">
          {confirmDelete ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg text-muted">Supprimer cette séance ?</span>
              <button className="btn px-4 py-2 text-base" onClick={async () => { await deleteSession(s.id); router.push("/"); }}>Supprimer</button>
              <button className="btn-ghost px-4 py-2 text-base" onClick={() => setConfirmDelete(false)}>Annuler</button>
            </div>
          ) : (
            <button className="text-base text-dim underline hover:text-ink" onClick={() => setConfirmDelete(true)}>Supprimer la séance</button>
          )}
        </div>
      )}
    </div>
  );
}

function GuestForm({ onAdd }: { onAdd: (name: string, sex: Sex, level: number) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  if (!open) return <button className="btn-ghost" onClick={() => setOpen(true)}>+ Ajouter un invité</button>;
  return (
    <form className="space-y-3 border-t border-line pt-3" onSubmit={(e) => {
      e.preventDefault();
      if (!name.trim() || !sex || !level) return;
      onAdd(name.trim().slice(0, 40), sex, level);
      setName(""); setSex(null); setLevel(null); setOpen(false);
    }}>
      <p className="display text-xl">Invité sans compte</p>
      <input id="guest-name" className="input" placeholder="Prénom" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="flex gap-1.5">
        {([["F", "Femme"], ["M", "Homme"]] as const).map(([k, l]) => (
          <button type="button" key={k} className={`chip ${sex === k ? "chip-on" : ""}`} onClick={() => setSex(k)}>{l}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {GUEST_LEVELS.map((l, i) => (
          <button type="button" key={l} className={`chip ${level === i + 1 ? "chip-on" : ""}`} onClick={() => setLevel(i + 1)}>{i + 1} · {l}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="btn" disabled={!name.trim() || !sex || !level}>Ajouter</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
      </div>
    </form>
  );
}
