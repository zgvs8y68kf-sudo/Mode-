import type { Profile } from "@/lib/types";

// Avatar stylisé : silhouette paramétrée par la morphologie, la peau et les cheveux.
const SHAPES: Record<string, { sh: number; w: number; hi: number }> = {
  sablier: { sh: 30, w: 19, hi: 31 },
  triangle: { sh: 25, w: 20, hi: 34 },
  "triangle-inverse": { sh: 35, w: 22, hi: 25 },
  rectangle: { sh: 28, w: 25, hi: 28 },
  ovale: { sh: 28, w: 33, hi: 30 },
  trapeze: { sh: 33, w: 25, hi: 27 },
};

export default function Avatar({ profile, size = 160 }: { profile: Partial<Profile>; size?: number }) {
  const s = SHAPES[profile.morphology ?? "rectangle"] ?? SHAPES.rectangle;
  const skin = profile.skinHex || "#d7a98c";
  const hair = profile.hairHex || "#3b2a20";
  const long = profile.sex === "femme";
  const cx = 60;
  const body = `M ${cx - s.sh} 72 Q ${cx} 64 ${cx + s.sh} 72 L ${cx + s.w} 118 L ${cx + s.hi} 150 L ${cx - s.hi} 150 L ${cx - s.w} 118 Z`;
  return (
    <svg viewBox="0 0 120 200" width={size * 0.6} height={size} role="img" aria-label="Avatar">
      {long && <path d={`M 40 40 Q 38 76 46 84 L 74 84 Q 82 76 80 40 Z`} fill={hair} />}
      <rect x={cx - 6} y={52} width={12} height={14} fill={skin} />
      <ellipse cx={cx} cy={38} rx={17} ry={20} fill={skin} />
      <path d={`M 43 36 Q 44 14 60 15 Q 77 14 77 36 Q 70 24 60 25 Q 50 24 43 36 Z`} fill={hair} />
      <path d={body} fill="#1b1a17" opacity={0.9} />
      <path d={`M ${cx - s.hi + 4} 150 L ${cx - 4} 150 L ${cx - 6} 194 L ${cx - s.hi + 10} 194 Z`} fill="#6f6a61" />
      <path d={`M ${cx + 4} 150 L ${cx + s.hi - 4} 150 L ${cx + s.hi - 10} 194 L ${cx + 6} 194 Z`} fill="#6f6a61" />
      <path d={`M ${cx - s.sh} 72 L ${cx - s.sh - 8} 128`} stroke={skin} strokeWidth={8} strokeLinecap="round" />
      <path d={`M ${cx + s.sh} 72 L ${cx + s.sh + 8} 128`} stroke={skin} strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
}
