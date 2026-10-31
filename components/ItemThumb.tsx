import type { Item } from "@/lib/types";

export default function ItemThumb({ item, size = "md" }: { item: Item; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-20 w-20" : "aspect-square w-full";
  return (
    <div className={`${dim} relative overflow-hidden rounded-xl border border-line bg-paper`}>
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full" style={{ background: item.colors[0]?.hex ?? "#ddd" }} />
      )}
      <div className="absolute bottom-1 left-1 flex gap-0.5">
        {item.colors.map((c) => (
          <span key={c.hex + c.name} title={c.name} className="h-3 w-3 rounded-full border border-white/80" style={{ background: c.hex }} />
        ))}
      </div>
    </div>
  );
}
