"use client";

import type { Presence } from "@/lib/types";

const OPTIONS: { key: Presence; label: string; on: string }[] = [
  { key: "yes", label: "Je viens", on: "bg-red text-white border-red" },
  { key: "maybe", label: "Peut-être", on: "bg-gold text-bg border-gold" },
  { key: "no", label: "Absent", on: "bg-ink text-bg border-ink" },
];

export default function PresencePicker({ value, onChange, disabled }: {
  value: Presence | undefined; onChange: (p: Presence) => void; disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-1.5" role="radiogroup" aria-label="Ma présence">
      {OPTIONS.map((o) => (
        <button key={o.key} role="radio" aria-checked={value === o.key} disabled={disabled}
          className={`display border-2 px-2 py-2.5 text-lg transition disabled:opacity-40 ${value === o.key ? o.on : "border-line bg-panel-2 text-muted hover:border-ink hover:text-ink"}`}
          onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
