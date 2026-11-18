// Vérifie l'algorithme d'équipes sur des groupes fictifs : npm test
import { makeTeams, teamStats, cost } from "../lib/teams.ts";
import { demoPlayers } from "../lib/demo.ts";
import { playerToMember } from "../lib/questionnaire.ts";
import assert from "node:assert/strict";

let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

for (const n of [8, 12, 13, 18, 24, 31]) {
  const members = demoPlayers(n, rnd).map(playerToMember);
  const k = Math.max(2, Math.round(n / 6));
  const t0 = performance.now();
  const teams = makeTeams(members, k, rnd);
  const ms = Math.round(performance.now() - t0);
  const sizes = teams.map((t) => t.length);
  const stats = teams.map(teamStats);
  assert.equal(sum(sizes), n, "tout le monde est placé");
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, "tailles à ±1");
  assert.equal(new Set(teams.flat().map((m) => m.id)).size, n, "pas de doublon");
  const lv = stats.map((s) => s.level);
  const w = stats.map((s) => s.women);
  assert.ok(Math.max(...w) - Math.min(...w) <= 1, "femmes réparties");
  assert.ok(Math.max(...lv) - Math.min(...lv) <= 0.6, `niveaux proches (${lv})`);
  console.log(`${n} joueurs / ${k} équipes en ${ms} ms · niveaux ${lv.map((x) => x.toFixed(2)).join(" / ")} · femmes ${w.join(" / ")} · coût ${cost(teams).toFixed(2)}`);
}
console.log("OK");

function sum(a: number[]) { return a.reduce((s, x) => s + x, 0); }
