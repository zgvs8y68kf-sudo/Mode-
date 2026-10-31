"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Aujourd'hui", icon: "☀" },
  { href: "/dressing", label: "Dressing", icon: "▦" },
  { href: "/analyse", label: "Analyse", icon: "◐" },
  { href: "/tendances", label: "Tendances", icon: "✦" },
  { href: "/profil", label: "Profil", icon: "◯" },
];

export default function Nav() {
  const path = usePathname();
  const active = (h: string) => (h === "/" ? path === "/" || path === "/tenue" : path.startsWith(h));
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-serif text-xl tracking-tight">
            Dressing<span className="text-accent">.</span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`chip ${active(l.href) ? "chip-on" : "border-transparent bg-transparent"}`}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-card/95 backdrop-blur sm:hidden">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`flex flex-col items-center py-2.5 text-[11px] ${active(l.href) ? "text-ink" : "text-muted"}`}>
            <span className="text-lg leading-none">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
