"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";

const LINKS = [
  { href: "/", label: "Séances", icon: <path d="M3 9h18M7 3v4M17 3v4M4 5h16v16H4z" /> },
  { href: "/profil", label: "Mon joueur", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" /></> },
];

export default function Nav() {
  const path = usePathname();
  const { user, enabled, me } = useApp();
  const active = (h: string) => (h === "/" ? path === "/" || path.startsWith("/seance") : path.startsWith(h));
  const initial = (me?.name ?? user?.email ?? "?").slice(0, 1).toUpperCase();
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="display text-xl">
            Volley<span className="text-red">·</span>Équipes
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden gap-1 sm:flex">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href}
                  className={`display px-3 py-1.5 text-base ${active(l.href) ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}>
                  {l.label}
                </Link>
              ))}
            </nav>
            {enabled && user && (
              <Link href="/compte" title={user.email ?? "Mon compte"} aria-label="Mon compte"
                className="display ml-2 grid h-8 w-8 place-items-center bg-gold text-base text-bg">
                {initial}
              </Link>
            )}
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex flex-col items-center gap-1 py-2.5 text-sm font-bold uppercase tracking-wider ${active(l.href) ? "text-gold" : "text-dim"}`}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">{l.icon}</svg>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
