import { shopLinks } from "@/lib/shops";
import type { MissingPiece } from "@/lib/types";

export default function MissingCard({ piece, preferred = [] }: { piece: MissingPiece; preferred?: string[] }) {
  return (
    <div className="flex gap-3 rounded-xl border border-dashed border-accent/40 bg-accent-soft/40 p-3">
      <div className="h-14 w-14 shrink-0 rounded-lg border border-line" style={{ background: piece.colorHex }} title={piece.colorName} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          <span className="mr-1 text-accent">Pièce manquante ·</span>
          {piece.name}
          {piece.priority && <span className="ml-2 text-xs text-muted">priorité {piece.priority}</span>}
        </p>
        <p className="mt-0.5 text-xs text-muted">{piece.why}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {shopLinks(piece.searchQuery, preferred).slice(0, 5).map((l) => (
            <a key={l.id} href={l.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-card px-2.5 py-1 text-xs hover:border-ink">
              {l.name} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
