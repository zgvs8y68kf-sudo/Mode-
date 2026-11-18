"use client";

import type { Presence } from "@/lib/types";

const OPTIONS: { key: Presence; label: string; on: string }[] = [
  { key: "yes", label: "Je viens", on: "border-ok bg-ok text-white" },
  { key: "maybe", label: "Peut-être", on: "border-maybe bg-maybe-soft text-maybe" },
  { key: "no", label: "Absent·e", on: "border-ink bg-ink text-card" },
];

export default function PresencePicker({ value, onChange, disabled }: {
  value: Presence | undefined; onChange: (p: Presence) => void; disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Ma présence">
      {OPTIONS.map((o) => (
        <button key={o.key} role="radio" aria-checked={value === o.key} disabled={disabled}
          className={`rounded-full border px-2 py-2 text-sm font-semibold transition disabled:opacity-40 ${value === o.key ? o.on : "border-line bg-card text-muted hover:border-ink"}`}
          onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
