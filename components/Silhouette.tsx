import { hexToHsl } from "@/lib/color";

// Silhouettes vectorielles de vêtements, colorées avec la vraie couleur de la pièce.
// Utilisées quand aucune photo n'est disponible (ex. pièce ajoutée par ticket de caisse).

const P = {
  tshirt: "M30 15 L42 10 Q50 17 58 10 L70 15 L88 32 L78 42 L70 36 L70 90 L30 90 L30 36 L22 42 L12 32 Z",
  pull: "M32 14 L43 10 Q50 16 57 10 L68 14 L80 30 L88 82 L78 85 L70 44 L70 90 L30 90 L30 44 L22 85 L12 82 L20 30 Z",
  chemise: "M32 14 L43 9 L50 18 L57 9 L68 14 L80 30 L88 82 L78 85 L70 44 L70 92 L30 92 L30 44 L22 85 L12 82 L20 30 Z",
  veste: "M30 12 L43 8 L50 30 L57 8 L70 12 L82 28 L88 84 L78 86 L71 44 L72 90 L28 90 L29 44 L22 86 L12 84 L18 28 Z",
  manteau: "M32 6 L44 4 L50 24 L56 4 L68 6 L80 24 L87 80 L77 82 L72 42 L75 97 L25 97 L28 42 L23 82 L13 80 L20 24 Z",
  pantalon: "M30 6 L70 6 L74 94 L56 94 L50 32 L44 94 L26 94 Z",
  short: "M27 22 L73 22 L77 70 L54 70 L50 46 L46 70 L23 70 Z",
  jupe: "M34 14 L66 14 L80 86 L20 86 Z",
  robe: "M38 6 L44 6 Q50 13 56 6 L62 6 L64 28 L58 38 L80 94 L20 94 L42 38 L36 28 Z",
  basket: "M8 64 L12 44 Q22 40 32 46 L50 52 Q72 53 86 60 Q93 64 91 74 L10 74 Z",
  bottine: "M28 14 L50 14 L52 56 Q72 58 85 64 Q90 70 88 80 L26 80 Z",
  escarpin: "M10 70 L18 52 Q40 58 62 54 L86 66 L88 72 L74 72 L72 82 L68 72 L12 72 Z",
  sac: "M20 40 L80 40 L85 90 L15 90 Z",
  echarpe: "M30 8 L48 8 L48 68 L58 92 L40 92 L33 72 L30 72 Z",
  ceinture: "M6 44 L94 44 L94 56 L6 56 Z",
  bonnet: "M22 70 Q20 22 50 20 Q80 22 78 70 Z",
  casquette: "M20 62 Q22 28 52 28 Q76 30 78 56 L94 62 Q94 68 86 68 L22 68 Z",
  lunettes: "M8 44 L44 44 L42 62 Q26 70 12 62 Z M56 44 L92 44 L88 62 Q74 70 58 62 Z",
  montre: "M40 8 L60 8 L62 32 Q76 40 74 52 Q76 64 62 70 L60 92 L40 92 L38 70 Q24 64 26 52 Q24 40 38 32 Z",
  bijou: "M50 20 Q78 22 76 50 Q74 78 50 80 Q26 78 24 50 Q22 22 50 20 Z",
};

export function shapeFor(category: string, subtype = ""): keyof typeof P {
  const t = `${category} ${subtype}`.toLowerCase();
  if (/short|bermuda/.test(t)) return "short";
  if (/jupe/.test(t)) return "jupe";
  if (/robe|combinaison/.test(t)) return "robe";
  if (/escarpin|ballerine|sandale|mule|mocassin/.test(t)) return "escarpin";
  if (/botte|bottine|boots|chelsea|derby|derbies|richelieu/.test(t)) return "bottine";
  if (/chauss|basket|sneaker|tennis|running/.test(t)) return "basket";
  if (/écharpe|echarpe|foulard|étole/.test(t)) return "echarpe";
  if (/ceinture/.test(t)) return "ceinture";
  if (/casquette/.test(t)) return "casquette";
  if (/bonnet|chapeau|béret/.test(t)) return "bonnet";
  if (/lunette/.test(t)) return "lunettes";
  if (/montre/.test(t)) return "montre";
  if (/collier|bague|bracelet|boucle|bijou/.test(t)) return "bijou";
  if (/sac|cabas|pochette|tote|sacoche|banane/.test(t)) return "sac";
  if (/manteau|parka|trench|doudoune/.test(t)) return "manteau";
  if (/veste|blazer|blouson|perfecto|surchemise/.test(t)) return "veste";
  if (/chemise|blouse/.test(t)) return "chemise";
  if (/pull|sweat|gilet|cardigan|hoodie|maille|col roulé/.test(t)) return "pull";
  if (/pantalon|jean|chino|jogging|legging|bas/.test(t)) return "pantalon";
  if (/accessoire/.test(t)) return "bijou";
  return "tshirt";
}

export default function Silhouette({ category, subtype, hex = "#cccccc", pattern = "", className = "" }: {
  category: string; subtype?: string; hex?: string; pattern?: string; className?: string;
}) {
  const shape = shapeFor(category, subtype);
  const { h, s, l } = hexToHsl(hex);
  const stroke = `hsl(${h} ${s}% ${Math.max(8, l - 22)}%)`;
  const id = `p${hex.replace("#", "")}${shape}`;
  const striped = /ray|marini/i.test(pattern);
  const checked = /carreau|tartan|vichy/i.test(pattern);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        {striped && <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill={hex} /><rect width="6" height="2" fill={stroke} opacity=".55" /></pattern>}
        {checked && <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill={hex} /><rect width="10" height="3" fill={stroke} opacity=".4" /><rect width="3" height="10" fill={stroke} opacity=".4" /></pattern>}
      </defs>
      {shape === "sac" && <path d="M34 40 Q34 14 50 14 Q66 14 66 40" fill="none" stroke={stroke} strokeWidth="4" />}
      <path d={P[shape]} fill={striped || checked ? `url(#${id})` : hex} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      {(shape === "chemise" || shape === "veste" || shape === "manteau") && <path d={shape === "chemise" ? "M50 18 L50 90" : "M50 26 L50 95"} stroke={stroke} strokeWidth="1.2" />}
    </svg>
  );
}
