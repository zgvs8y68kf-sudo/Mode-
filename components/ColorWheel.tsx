import { hexToHsl, isNeutral } from "@/lib/color";

/** Roue chromatique : place chaque couleur du dressing selon sa teinte (angle) et sa saturation (rayon). */
export default function ColorWheel({ colors, palette = [] }: { colors: string[]; palette?: string[] }) {
  const R = 100;
  const pt = (hex: string, r: number) => {
    const { h } = hexToHsl(hex);
    const a = ((h - 90) * Math.PI) / 180;
    return [120 + Math.cos(a) * r, 120 + Math.sin(a) * r];
  };
  const neutrals = colors.filter(isNeutral);
  const colored = colors.filter((c) => !isNeutral(c));
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 240 240" className="w-full max-w-[280px]" role="img" aria-label="Roue chromatique du dressing">
        <defs>
          <clipPath id="ring"><circle cx="120" cy="120" r={R + 12} /></clipPath>
        </defs>
        {Array.from({ length: 36 }, (_, i) => {
          const a0 = ((i * 10 - 95) * Math.PI) / 180;
          const a1 = ((i * 10 - 85) * Math.PI) / 180;
          return (
            <path key={i} clipPath="url(#ring)"
              d={`M120 120 L ${120 + Math.cos(a0) * 130} ${120 + Math.sin(a0) * 130} L ${120 + Math.cos(a1) * 130} ${120 + Math.sin(a1) * 130} Z`}
              fill={`hsl(${i * 10} 55% 72%)`} opacity={0.35} />
          );
        })}
        <circle cx="120" cy="120" r={R - 28} fill="var(--color-card)" />
        {palette.map((hex, i) => {
          const [x, y] = pt(hex, R + 4);
          return <circle key={"p" + i} cx={x} cy={y} r={6} fill={hex} stroke="#1b1a17" strokeDasharray="2 2" strokeWidth={1} />;
        })}
        {colored.map((hex, i) => {
          const [x, y] = pt(hex, R - 14 + (hexToHsl(hex).s / 100) * 14);
          return <circle key={i} cx={x} cy={y} r={7} fill={hex} stroke="#fff" strokeWidth={1.5} />;
        })}
        {neutrals.slice(0, 12).map((hex, i) => {
          const a = (i / Math.max(1, Math.min(neutrals.length, 12))) * 2 * Math.PI;
          return <circle key={"n" + i} cx={120 + Math.cos(a) * 34} cy={120 + Math.sin(a) * 34} r={8} fill={hex} stroke="#fff" strokeWidth={1.5} />;
        })}
        <text x="120" y="124" textAnchor="middle" fontSize="9" fill="var(--color-muted)">neutres</text>
      </svg>
      <p className="text-center text-xs text-muted">
        Points pleins : tes pièces · pointillés : ta palette idéale. Couleurs opposées = complémentaires, voisines = analogues.
      </p>
    </div>
  );
}
