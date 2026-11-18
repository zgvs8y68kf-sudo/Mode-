"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";

const LINKS = [
  { href: "/", label: "Séances", icon: "🏐" },
  { href: "/profil", label: "Mon profil", icon: "👤" },
];

export default function Nav() {
  const path = usePathname();
  const { user, enabled, me } = useApp();
  const active = (h: string) => (h === "/" ? path === "/" || path.startsWith("/seance") : path.startsWith(h));
  const initial = (me?.name ?? user?.email ?? "?").slice(0, 1).toUpperCase();
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-base">🏐</span>
            Volley<span className="text-accent">·</span>Équipes
          </Link>
          <div className="flex items-center gap-2">
            <nav className="hidden gap-1 sm:flex">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={`chip ${active(l.href) ? "chip-on" : "border-transparent bg-transparent"}`}>
                  {l.label}
                </Link>
              ))}
            </nav>
            {enabled && user && (
              <Link href="/compte" title={user.email ?? "Mon compte"}
                className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-bold text-card">
                {initial}
              </Link>
            )}
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${active(l.href) ? "text-ink" : "text-muted"}`}>
            <span className="text-lg leading-none">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
