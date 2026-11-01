// Enseignes. Aucune ne propose d'API catalogue publique : on génère des liens de recherche.
// - `search` : URL de recherche interne de l'enseigne (format connu et stable)
// - sinon : recherche Google limitée au site de l'enseigne (fonctionne toujours)
// L'IA n'invente jamais d'URL produit. Voir docs/CONCEPT.md pour la piste flux affiliés.

export type ShopGroup =
  | "Multimarques"
  | "Mode accessible"
  | "Milieu de gamme"
  | "Marques françaises"
  | "Premium & créateurs"
  | "Denim & workwear"
  | "Sport & outdoor"
  | "Chaussures"
  | "Sacs, bijoux & accessoires"
  | "Seconde main";

export type Tier = "petit" | "moyen" | "premium";

export interface Shop {
  id: string;
  name: string;
  domain: string;
  group: ShopGroup;
  tier: Tier;
  search?: (q: string) => string;
}

const e = encodeURIComponent;
const S = (id: string, name: string, domain: string, group: ShopGroup, tier: Tier, search?: (q: string) => string): Shop =>
  ({ id, name, domain, group, tier, search });

export const SHOPS: Shop[] = [
  // Multimarques
  S("zalando", "Zalando", "zalando.fr", "Multimarques", "moyen", (q) => `https://www.zalando.fr/catalogue/?q=${e(q)}`),
  S("asos", "ASOS", "asos.com/fr", "Multimarques", "petit", (q) => `https://www.asos.com/fr/search/?q=${e(q)}`),
  S("aboutyou", "About You", "aboutyou.fr", "Multimarques", "moyen"),
  S("laredoute", "La Redoute", "laredoute.fr", "Multimarques", "petit"),
  S("galeries", "Galeries Lafayette", "galerieslafayette.com", "Multimarques", "premium"),
  S("printemps", "Printemps", "printemps.com", "Multimarques", "premium"),
  S("24s", "24S (Bon Marché)", "24s.com", "Multimarques", "premium"),
  S("amazon", "Amazon Mode", "amazon.fr", "Multimarques", "petit", (q) => `https://www.amazon.fr/s?k=${e(q)}`),
  S("farfetch", "Farfetch", "farfetch.com", "Multimarques", "premium"),
  S("mrporter", "Mr Porter", "mrporter.com", "Multimarques", "premium"),
  S("netaporter", "Net-a-Porter", "net-a-porter.com", "Multimarques", "premium"),
  S("ssense", "SSENSE", "ssense.com", "Multimarques", "premium"),
  S("end", "END. Clothing", "endclothing.com", "Multimarques", "premium"),
  // Mode accessible
  S("zara", "Zara", "zara.com", "Mode accessible", "petit", (q) => `https://www.zara.com/fr/fr/search?searchTerm=${e(q)}`),
  S("hm", "H&M", "hm.com", "Mode accessible", "petit", (q) => `https://www2.hm.com/fr_fr/search-results.html?q=${e(q)}`),
  S("uniqlo", "Uniqlo", "uniqlo.com", "Mode accessible", "petit", (q) => `https://www.uniqlo.com/fr/fr/search?q=${e(q)}`),
  S("mango", "Mango", "mango.com", "Mode accessible", "petit"),
  S("pullbear", "Pull&Bear", "pullandbear.com", "Mode accessible", "petit"),
  S("bershka", "Bershka", "bershka.com", "Mode accessible", "petit"),
  S("stradivarius", "Stradivarius", "stradivarius.com", "Mode accessible", "petit"),
  S("lefties", "Lefties", "lefties.com", "Mode accessible", "petit"),
  S("primark", "Primark", "primark.com", "Mode accessible", "petit"),
  S("kiabi", "Kiabi", "kiabi.com", "Mode accessible", "petit"),
  S("ca", "C&A", "c-and-a.com", "Mode accessible", "petit"),
  S("gap", "Gap", "gap.fr", "Mode accessible", "petit"),
  S("jules", "Jules", "jules.com", "Mode accessible", "petit"),
  S("celio", "Celio", "celio.com", "Mode accessible", "petit"),
  S("bonobo", "Bonobo", "bonoboplanet.com", "Mode accessible", "petit"),
  S("promod", "Promod", "promod.fr", "Mode accessible", "petit"),
  S("monoprix", "Monoprix", "monoprix.fr", "Mode accessible", "petit"),
  S("springfield", "Springfield", "springfield.com", "Mode accessible", "petit"),
  S("superdry", "Superdry", "superdry.fr", "Mode accessible", "moyen"),
  // Milieu de gamme
  S("cos", "COS", "cos.com", "Milieu de gamme", "moyen"),
  S("arket", "Arket", "arket.com", "Milieu de gamme", "moyen"),
  S("otherstories", "& Other Stories", "stories.com", "Milieu de gamme", "moyen"),
  S("massimodutti", "Massimo Dutti", "massimodutti.com", "Milieu de gamme", "moyen"),
  S("weekday", "Weekday", "weekday.com", "Milieu de gamme", "moyen"),
  S("monki", "Monki", "monki.com", "Milieu de gamme", "petit"),
  S("benetton", "Benetton", "benetton.com", "Milieu de gamme", "moyen"),
  S("ikks", "IKKS", "ikks.com", "Milieu de gamme", "moyen"),
  S("tommy", "Tommy Hilfiger", "tommy.com", "Milieu de gamme", "moyen"),
  S("ck", "Calvin Klein", "calvinklein.fr", "Milieu de gamme", "moyen"),
  S("lacoste", "Lacoste", "lacoste.com", "Milieu de gamme", "moyen"),
  S("gant", "Gant", "gant.fr", "Milieu de gamme", "moyen"),
  S("boss", "Hugo Boss", "hugoboss.com", "Milieu de gamme", "premium"),
  S("ralphlauren", "Ralph Lauren", "ralphlauren.fr", "Milieu de gamme", "premium"),
  S("comptoir", "Comptoir des Cotonniers", "comptoirdescotonniers.com", "Milieu de gamme", "moyen"),
  S("desPetitsHauts", "Des Petits Hauts", "despetitshauts.com", "Milieu de gamme", "moyen"),
  S("bash", "ba&sh", "ba-sh.com", "Milieu de gamme", "premium"),
  S("claudiepierlot", "Claudie Pierlot", "claudiepierlot.com", "Milieu de gamme", "premium"),
  S("brice", "Brice", "brice.fr", "Milieu de gamme", "petit"),
  S("devred", "Devred", "devred.com", "Milieu de gamme", "moyen"),
  // Marques françaises (DNVB / made in France)
  S("sezane", "Sézane", "sezane.com", "Marques françaises", "moyen"),
  S("rouje", "Rouje", "rouje.com", "Marques françaises", "moyen"),
  S("sessun", "Sessùn", "sessun.com", "Marques françaises", "moyen"),
  S("asphalte", "Asphalte", "asphalte.com", "Marques françaises", "moyen"),
  S("loom", "Loom", "loom.fr", "Marques françaises", "moyen"),
  S("slipfrancais", "Le Slip Français", "leslipfrancais.fr", "Marques françaises", "moyen"),
  S("balibaris", "Balibaris", "balibaris.com", "Marques françaises", "moyen"),
  S("faguo", "Faguo", "faguo-store.com", "Marques françaises", "moyen"),
  S("armorlux", "Armor-Lux", "armorlux.com", "Marques françaises", "moyen"),
  S("saintjames", "Saint James", "saint-james.com", "Marques françaises", "moyen"),
  S("petitbateau", "Petit Bateau", "petit-bateau.fr", "Marques françaises", "moyen"),
  S("hast", "Hast", "hast.fr", "Marques françaises", "moyen"),
  S("cuisse", "Cuisse de Grenouille", "cuissedegrenouille.com", "Marques françaises", "moyen"),
  // Premium & créateurs
  S("sandro", "Sandro", "sandro-paris.com", "Premium & créateurs", "premium"),
  S("maje", "Maje", "maje.com", "Premium & créateurs", "premium"),
  S("kooples", "The Kooples", "thekooples.com", "Premium & créateurs", "premium"),
  S("zadig", "Zadig & Voltaire", "zadig-et-voltaire.com", "Premium & créateurs", "premium"),
  S("ami", "AMI Paris", "amiparis.com", "Premium & créateurs", "premium"),
  S("apc", "A.P.C.", "apc.fr", "Premium & créateurs", "premium"),
  S("kitsune", "Maison Kitsuné", "maisonkitsune.com", "Premium & créateurs", "premium"),
  S("officine", "Officine Générale", "officinegenerale.com", "Premium & créateurs", "premium"),
  S("isabelmarant", "Isabel Marant", "isabelmarant.com", "Premium & créateurs", "premium"),
  S("jacquemus", "Jacquemus", "jacquemus.com", "Premium & créateurs", "premium"),
  S("acne", "Acne Studios", "acnestudios.com", "Premium & créateurs", "premium"),
  S("ganni", "Ganni", "ganni.com", "Premium & créateurs", "premium"),
  // Denim & workwear
  S("levis", "Levi's", "levi.com", "Denim & workwear", "moyen", (q) => `https://www.levi.com/FR/fr_FR/search/${e(q)}`),
  S("lee", "Lee", "lee.com", "Denim & workwear", "moyen"),
  S("wrangler", "Wrangler", "wrangler.com", "Denim & workwear", "moyen"),
  S("diesel", "Diesel", "diesel.com", "Denim & workwear", "moyen"),
  S("gstar", "G-Star RAW", "g-star.com", "Denim & workwear", "moyen"),
  S("carhartt", "Carhartt WIP", "carhartt-wip.com", "Denim & workwear", "moyen"),
  S("dickies", "Dickies", "dickies.com", "Denim & workwear", "moyen"),
  S("lebondenim", "1083", "1083.fr", "Denim & workwear", "moyen"),
  // Sport & outdoor
  S("decathlon", "Decathlon", "decathlon.fr", "Sport & outdoor", "petit", (q) => `https://www.decathlon.fr/search?Ntt=${e(q)}`),
  S("nike", "Nike", "nike.com", "Sport & outdoor", "moyen", (q) => `https://www.nike.com/fr/w?q=${e(q)}`),
  S("adidas", "adidas", "adidas.fr", "Sport & outdoor", "moyen", (q) => `https://www.adidas.fr/search?q=${e(q)}`),
  S("puma", "Puma", "puma.com", "Sport & outdoor", "moyen"),
  S("newbalance", "New Balance", "newbalance.fr", "Sport & outdoor", "moyen"),
  S("asics", "ASICS", "asics.com", "Sport & outdoor", "moyen"),
  S("lululemon", "lululemon", "lululemon.fr", "Sport & outdoor", "premium"),
  S("tnf", "The North Face", "thenorthface.fr", "Sport & outdoor", "moyen"),
  S("patagonia", "Patagonia", "patagonia.com", "Sport & outdoor", "premium"),
  S("columbia", "Columbia", "columbiasportswear.fr", "Sport & outdoor", "moyen"),
  S("napapijri", "Napapijri", "napapijri.fr", "Sport & outdoor", "moyen"),
  S("salomon", "Salomon", "salomon.com", "Sport & outdoor", "moyen"),
  S("quechua", "Quechua", "decathlon.fr", "Sport & outdoor", "petit"),
  // Chaussures
  S("sarenza", "Sarenza", "sarenza.com", "Chaussures", "moyen"),
  S("spartoo", "Spartoo", "spartoo.com", "Chaussures", "petit"),
  S("courir", "Courir", "courir.com", "Chaussures", "moyen"),
  S("snipes", "Snipes", "snipes.com", "Chaussures", "moyen"),
  S("veja", "Veja", "veja-store.com", "Chaussures", "moyen"),
  S("converse", "Converse", "converse.com", "Chaussures", "moyen"),
  S("vans", "Vans", "vans.fr", "Chaussures", "moyen"),
  S("drmartens", "Dr. Martens", "drmartens.com", "Chaussures", "moyen"),
  S("clarks", "Clarks", "clarks.fr", "Chaussures", "moyen"),
  S("birkenstock", "Birkenstock", "birkenstock.com", "Chaussures", "moyen"),
  S("timberland", "Timberland", "timberland.fr", "Chaussures", "moyen"),
  S("paraboot", "Paraboot", "paraboot.com", "Chaussures", "premium"),
  S("bocage", "Bocage", "bocage.fr", "Chaussures", "moyen"),
  S("eram", "Eram", "eram.fr", "Chaussures", "petit"),
  S("andre", "André", "andre.fr", "Chaussures", "petit"),
  // Sacs, bijoux & accessoires
  S("polene", "Polène", "polene-paris.com", "Sacs, bijoux & accessoires", "premium"),
  S("longchamp", "Longchamp", "longchamp.com", "Sacs, bijoux & accessoires", "premium"),
  S("letanneur", "Le Tanneur", "letanneur.com", "Sacs, bijoux & accessoires", "moyen"),
  S("fossil", "Fossil", "fossil.com", "Sacs, bijoux & accessoires", "moyen"),
  S("swatch", "Swatch", "swatch.com", "Sacs, bijoux & accessoires", "moyen"),
  S("rayban", "Ray-Ban", "ray-ban.com", "Sacs, bijoux & accessoires", "moyen"),
  S("pandora", "Pandora", "pandora.net", "Sacs, bijoux & accessoires", "moyen"),
  S("maty", "Maty", "maty.com", "Sacs, bijoux & accessoires", "moyen"),
  S("histoiredor", "Histoire d'Or", "histoiredor.com", "Sacs, bijoux & accessoires", "moyen"),
  S("bijouxlouise", "Louise", "bijoux-louise.com", "Sacs, bijoux & accessoires", "petit"),
  S("eastpak", "Eastpak", "eastpak.com", "Sacs, bijoux & accessoires", "petit"),
  S("herschel", "Herschel", "herschel.eu", "Sacs, bijoux & accessoires", "moyen"),
  // Seconde main
  S("vinted", "Vinted", "vinted.fr", "Seconde main", "petit", (q) => `https://www.vinted.fr/catalog?search_text=${e(q)}`),
  S("vestiaire", "Vestiaire Collective", "vestiairecollective.com", "Seconde main", "moyen", (q) => `https://fr.vestiairecollective.com/search/?q=${e(q)}`),
  S("leboncoin", "leboncoin", "leboncoin.fr", "Seconde main", "petit", (q) => `https://www.leboncoin.fr/recherche?text=${e(q)}`),
  S("labelemmaus", "Label Emmaüs", "label-emmaus.co", "Seconde main", "petit"),
  S("imparfaite", "Imparfaite", "imparfaite.com", "Seconde main", "moyen"),
];

export const SHOP_GROUPS = [...new Set(SHOPS.map((s) => s.group))];

export function shopUrl(shop: Shop, query: string) {
  return shop.search
    ? shop.search(query)
    : `https://www.google.com/search?q=${e(`site:${shop.domain} ${query}`)}`;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
const byName = new Map(SHOPS.map((s) => [norm(s.name), s]));

/** Retrouve une enseigne à partir du nom renvoyé par l'IA (« H&M », « Levis »…). */
export function findShop(name: string) {
  const n = norm(name);
  return byName.get(n) ?? SHOPS.find((s) => norm(s.name).startsWith(n) || n.startsWith(norm(s.name)));
}

/**
 * Liens à afficher pour une pièce : d'abord les enseignes suggérées par l'IA,
 * puis les préférées de la personne, puis les incontournables de son budget.
 */
export function shopLinks(query: string, opts: { suggested?: string[]; preferred?: string[]; budget?: Tier; limit?: number } = {}) {
  const picked: Shop[] = [];
  const add = (s?: Shop) => s && !picked.some((p) => p.id === s.id) && picked.push(s);
  opts.suggested?.forEach((n) => add(findShop(n)));
  opts.preferred?.forEach((id) => add(SHOPS.find((s) => s.id === id)));
  ["zalando", "uniqlo", "zara", "hm", "vinted"].forEach((id) => add(SHOPS.find((s) => s.id === id)));
  const top = picked.slice(0, opts.limit ?? 6);
  const rest = SHOPS.filter((s) => !top.includes(s) && (!opts.budget || s.tier === opts.budget || s.group === "Multimarques" || s.group === "Seconde main"));
  const link = (s: Shop) => ({ id: s.id, name: s.name, group: s.group, href: shopUrl(s, query) });
  return { top: top.map(link), rest: rest.map(link) };
}

/** Liste compacte pour le prompt de l'IA (elle choisit ses suggestions dedans). */
export function shopsForPrompt(budget?: Tier, preferred: string[] = []) {
  const pref = preferred.map((id) => SHOPS.find((s) => s.id === id)?.name).filter(Boolean);
  const groups = SHOP_GROUPS.map((g) => {
    const list = SHOPS.filter((s) => s.group === g).map((s) => `${s.name}${s.tier === budget ? "*" : ""}`);
    return `- ${g} : ${list.join(", ")}`;
  });
  return `Enseignes disponibles (* = dans le budget « ${budget ?? "moyen"} ») :\n${groups.join("\n")}\n` +
    `Enseignes préférées : ${pref.join(", ") || "aucune"}.\n` +
    `Dans "brands", propose 2 à 4 enseignes de cette liste, en priorité les préférées et celles du budget, adaptées au type de pièce (ex. chaussures → enseignes de chaussures possibles).`;
}
