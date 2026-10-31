// Liens de recherche vers les enseignes. Aucune de ces marques ne propose d'API
// catalogue publique : on génère des recherches pré-remplies (fiables, jamais d'URL
// inventée par l'IA). Voir docs/CONCEPT.md pour la piste flux affiliés (Awin, etc.).

export const SHOPS: { id: string; name: string; url: (q: string) => string }[] = [
  { id: "zalando", name: "Zalando", url: (q) => `https://www.zalando.fr/catalogue/?q=${encodeURIComponent(q)}` },
  { id: "uniqlo", name: "Uniqlo", url: (q) => `https://www.uniqlo.com/fr/fr/search?q=${encodeURIComponent(q)}` },
  { id: "hm", name: "H&M", url: (q) => `https://www2.hm.com/fr_fr/search-results.html?q=${encodeURIComponent(q)}` },
  { id: "zara", name: "Zara", url: (q) => `https://www.zara.com/fr/fr/search?searchTerm=${encodeURIComponent(q)}` },
  { id: "levis", name: "Levi's", url: (q) => `https://www.levi.com/FR/fr_FR/search/${encodeURIComponent(q)}` },
  { id: "vinted", name: "Vinted (seconde main)", url: (q) => `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(q)}` },
];

export function shopLinks(query: string, preferred: string[] = []) {
  const sorted = [...SHOPS].sort(
    (a, b) => Number(preferred.includes(b.id)) - Number(preferred.includes(a.id)),
  );
  return sorted.map((s) => ({ id: s.id, name: s.name, href: s.url(query) }));
}
