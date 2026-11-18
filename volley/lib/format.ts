const DAY = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const s = DAY.format(new Date(y, m - 1, d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const formatTime = (t: string) => (t ? t.replace(":", "h").replace(/h00$/, "h") : "");

export function relativeDay(iso: string): string | null {
  const [y, m, d] = iso.split("-").map(Number);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff < 0) return "Passée";
  return null;
}

export const plural = (n: number, one: string, many = one + "s") => `${n} ${n > 1 ? many : one}`;
