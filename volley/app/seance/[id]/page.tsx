"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import PresencePicker from "@/components/PresencePicker";
import { formatDate, formatTime, plural, relativeDay } from "@/lib/format";
import { GUEST_LEVELS, POSTES, guestToMember, playerToMember } from "@/lib/questionnaire";
import { addGuest, deleteSession, removeGuest, saveTeams, setPresence, subscribeSession } from "@/lib/store";
import { makeTeams, suggestedTeamCount, teamStats } from "@/lib/teams";
import type { Member, Session, Sex } from "@/lib/types";

const TEAM_COLORS = [
  { name: "Bleus", bg: "#2563eb" },
  { name: "Rouges", bg: "#e11d48" },
  { name: "Verts", bg: "#16a34a" },
  { name: "Jaunes", bg: "#d97706" },
  { name: "Violets", bg: "#7c3aed" },
  { name: "Turquoise", bg: "#0d9488" },
];

export default function SeancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { uid, me, players, playersLoaded } = useApp();
  const [s, setS] = useState<Session | null | undefined>(undefined);
  const [k, setK] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => (uid ? subscribeSession(id, setS) : undefined), [uid, id]);

  // Présents = joueurs ayant répondu « Je viens » + invités.
  const present: Member[] = useMemo(() => {
    if (!s) return [];
    const ps = Object.entries(s.presence).filter(([, p]) => p === "yes").map(([pid]) => players[pid]).filter(Boolean).map(playerToMember);
    const gs = Object.values(s.guests).map(guestToMember);
    return [...ps, ...gs].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [s, players]);

  if (s === undefined || !uid || !playersLoaded) return <p className="pt-10 text-center text-sm text-muted">Chargement…</p>;
  if (s === null)
    return (
      <div className="card text-center text-sm text-muted">
        Cette séance n'existe plus. <Link href="/" className="font-semibold text-ink underline">Retour aux séances</Link>
      </div>
    );

  const byId = new Map(present.map((m) => [m.id, m]));
  const names = (st: "maybe" | "no") =>
    Object.entries(s.presence).filter(([, p]) => p === st).map(([pid]) => players[pid]?.name).filter(Boolean) as string[];
  const noAnswer = Object.values(players).filter((p) => !s.presence[p.id] && !p.id.startsWith("demo-")).map((p) => p.name);
  const nbTeams = k ?? (s.teams?.groups.length || suggestedTeamCount(present.length));
  const maxTeams = Math.max(2, Math.min(6, Math.floor(present.length / 2)));

  const teamIds = new Set(s.teams?.groups.flat() ?? []);
  const stale = !!s.teams && (teamIds.size !== present.length || present.some((m) => !teamIds.has(m.id)));
  const teams: Member[][] = s.teams ? s.teams.groups.map((g) => g.map((mid) => byId.get(mid)).filter((m): m is Member => !!m)) : [];

  async function generate() {
    setBusy(true);
    // Laisse le bouton se mettre à jour avant le calcul.
    await new Promise((r) => setTimeout(r, 20));
    try {
      const groups = makeTeams(present, nbTeams).map((t) => t.map((m) => m.id));
      await saveTeams(s!.id, { at: Date.now(), by: uid!, groups });
    } finally { setBusy(false); }
  }

  async function copy() {
    const lines = [`🏐 ${formatDate(s!.date)}${s!.time ? " · " + formatTime(s!.time) : ""}`, ""];
    teams.forEach((t, i) => {
      lines.push(`${["🔵", "🔴", "🟢", "🟡", "🟣", "🩵"][i]} ${TEAM_COLORS[i].name} : ${t.map((m) => m.name).join(", ")}`);
    });
    try { await navigator.clipboard.writeText(lines.join("\n")); } catch { return prompt("Copie ce texte :", lines.join("\n")); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const rel = relativeDay(s.date);

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted">← Séances</Link>
      <div className="card space-y-3">
        <div>
          {rel && <span className="mb-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent">{rel}</span>}
          <h1 className="text-2xl leading-tight">{formatDate(s.date)}{s.time && ` · ${formatTime(s.time)}`}</h1>
          {s.place && <p className="text-sm text-muted">📍 {s.place}</p>}
        </div>
        {me ? (
          <PresencePicker value={s.presence[uid]} onChange={(p) => setPresence(s.id, uid, p)} />
        ) : (
          <Link href="/profil" className="btn-accent w-full">Remplir mon profil pour m'inscrire</Link>
        )}
      </div>

      <section className="card space-y-3">
        <h2 className="text-lg">✅ {plural(present.length, "présent·e", "présent·e·s")}</h2>
        {present.length === 0 ? <p className="text-sm text-muted">Personne pour l'instant.</p> : (
          <div className="flex flex-wrap gap-1.5">
            {present.map((m) => (
              <span key={m.id} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${m.guest ? "border border-dashed border-line" : "bg-ok-soft"}`}>
                {m.name}
                {m.guest && <>
                  <span className="text-[10px] text-muted">invité·e</span>
                  <button aria-label={`Retirer ${m.name}`} className="ml-0.5 text-muted hover:text-ink" onClick={() => removeGuest(s.id, m.id.slice(6))}>×</button>
                </>}
              </span>
            ))}
          </div>
        )}
        {names("maybe").length > 0 && <p className="text-sm"><span className="font-semibold text-maybe">Peut-être :</span> {names("maybe").join(", ")}</p>}
        {names("no").length > 0 && <p className="text-sm text-muted"><span className="font-semibold">Absent·e·s :</span> {names("no").join(", ")}</p>}
        {noAnswer.length > 0 && <p className="text-sm text-muted"><span className="font-semibold">Pas encore répondu :</span> {noAnswer.join(", ")}</p>}
        <GuestForm onAdd={(name, sex, level) => addGuest(s.id, { id: Math.random().toString(36).slice(2, 9), name, sex, level, addedBy: uid })} />
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg">🏆 Équipes</h2>
          <p className="text-sm text-muted">Équilibrées sur le niveau, la mixité, la passe, chaque geste et l'âge.</p>
        </div>
        {present.length < 4 ? (
          <p className="text-sm text-muted">Il faut au moins 4 présents pour faire des équipes.</p>
        ) : (
          <>
            <div>
              <span className="label">Nombre d'équipes</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: maxTeams - 1 }, (_, i) => i + 2).map((n) => (
                  <button key={n} className={`chip ${nbTeams === n ? "chip-on" : ""}`} onClick={() => setK(n)}>
                    {n} <span className="opacity-60">· {Math.floor(present.length / n)}{present.length % n ? `-${Math.ceil(present.length / n)}` : ""} joueurs</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-accent w-full py-3" disabled={busy} onClick={generate}>
              {busy ? "Calcul…" : s.teams ? "🔀 Refaire les équipes" : "⚡ Faire les équipes"}
            </button>
          </>
        )}

        {stale && <p className="rounded-xl bg-maybe-soft p-3 text-sm text-maybe">La liste des présents a changé depuis : refais les équipes pour inclure tout le monde.</p>}

        {teams.length > 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.map((t, i) => {
                const st = teamStats(t);
                const c = TEAM_COLORS[i % TEAM_COLORS.length];
                return (
                  <div key={i} className="overflow-hidden rounded-2xl border border-line">
                    <div className="flex items-center justify-between px-4 py-2.5 text-white" style={{ background: c.bg }}>
                      <span className="font-extrabold" style={{ fontFamily: "var(--font-display)" }}>{c.name}</span>
                      <span className="text-xs opacity-90">{t.length} joueurs</span>
                    </div>
                    <ul className="divide-y divide-line">
                      {t.map((m) => (
                        <li key={m.id} className="flex items-center justify-between px-4 py-2 text-sm">
                          <span>{m.name}{m.guest && <span className="ml-1 text-[10px] text-muted">invité·e</span>}</span>
                          {m.poste !== "polyvalent" && <span className="text-[11px] text-muted">{POSTES.find((p) => p.key === m.poste)?.label}</span>}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-line bg-paper px-4 py-2 text-[11px] text-muted">
                      <span>Niveau <b className="text-ink">{st.level.toFixed(1).replace(".", ",")}</b>/10</span>
                      <span>{st.women} F · {st.men} H</span>
                      {st.age !== null && <span>~{st.age} ans</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="btn-ghost w-full" onClick={copy}>{copied ? "✓ Copié !" : "📋 Copier pour le groupe WhatsApp"}</button>
          </>
        )}
      </section>

      {s.createdBy === uid && (
        <div className="text-center">
          <button className="text-xs text-muted underline" onClick={async () => {
            if (!confirm("Supprimer cette séance ?")) return;
            await deleteSession(s.id);
            router.push("/");
          }}>Supprimer la séance</button>
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
  if (!open) return <button className="btn-ghost" onClick={() => setOpen(true)}>+ Ajouter un·e invité·e</button>;
  return (
    <form className="space-y-3 rounded-2xl bg-paper p-4" onSubmit={(e) => {
      e.preventDefault();
      if (!name.trim() || !sex || !level) return;
      onAdd(name.trim().slice(0, 40), sex, level);
      setName(""); setSex(null); setLevel(null); setOpen(false);
    }}>
      <p className="text-sm font-semibold">Invité·e sans compte</p>
      <input className="input" placeholder="Prénom" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="flex gap-1.5">
        {([["F", "Femme"], ["M", "Homme"]] as const).map(([k, l]) => (
          <button type="button" key={k} className={`chip ${sex === k ? "chip-on" : ""}`} onClick={() => setSex(k)}>{l}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {GUEST_LEVELS.map((l, i) => (
          <button type="button" key={l} className={`chip ${level === i + 1 ? "chip-on" : ""}`} onClick={() => setLevel(i + 1)}>{l}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="btn" disabled={!name.trim() || !sex || !level}>Ajouter</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
      </div>
    </form>
  );
}
