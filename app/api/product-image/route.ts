import { groundedSearch } from "@/lib/gemini";
import { HttpError, jsonError, readBody, requireUser } from "@/lib/api";

export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

function assertPublicUrl(raw: string) {
  let u: URL;
  try { u = new URL(raw); } catch { throw new HttpError(400, "Lien invalide"); }
  if (u.protocol !== "https:") throw new HttpError(400, "Le lien doit commencer par https://");
  const h = u.hostname;
  if (h === "localhost" || /^(\d+\.){3}\d+$/.test(h) || h.includes(":") || h.endsWith(".internal") || h.endsWith(".local"))
    throw new HttpError(400, "Lien non autorisé");
  return u;
}

/** Récupère les images produit d'une page (og:image, JSON-LD Product, twitter:image). */
async function imagesFromPage(pageUrl: string) {
  const u = assertPublicUrl(pageUrl);
  const r = await fetch(u, {
    headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9", Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });
  if (!r.ok) throw new HttpError(502, `Le site de la marque refuse la lecture automatique (${r.status}).`);
  const html = (await r.text()).slice(0, 3_000_000);
  const found: string[] = [];
  const push = (v?: unknown) => {
    if (typeof v === "string" && v) found.push(v);
    else if (Array.isArray(v)) v.forEach(push);
    else if (v && typeof v === "object" && "url" in v) push((v as { url: unknown }).url);
  };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = (Array.isArray(data) ? data : [data]).flatMap((d) => (d["@graph"] ? d["@graph"] : [d]));
      for (const n of nodes) if (/Product/i.test(String(n["@type"]))) push(n.image);
    } catch { /* JSON-LD invalide : ignoré */ }
  }
  for (const m of html.matchAll(/<meta[^>]+(?:property|name|itemprop)=["'](?:og:image(?::secure_url)?|twitter:image|image)["'][^>]*>/gi)) {
    push(m[0].match(/content=["']([^"']+)["']/i)?.[1]);
  }
  const title = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ?? "";
  const images = [...new Set(found.map((s) => { try { return new URL(s.replace(/&amp;/g, "&"), u).toString(); } catch { return ""; } }))]
    .filter((s) => s.startsWith("https://"))
    .slice(0, 12);
  return { images, title, page: u.toString() };
}

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const body = await readBody<{ url?: string; brand?: string; name?: string; reference?: string; color?: string }>(req);

    if (body.url) {
      const res = await imagesFromPage(body.url);
      if (!res.images.length) throw new HttpError(404, "Aucune photo produit trouvée sur cette page.");
      return Response.json(res);
    }

    // Recherche automatique de la fiche produit (nécessite la recherche Google de Gemini).
    const q = [body.brand, body.name, body.color, body.reference].filter(Boolean).join(" ");
    let search;
    try {
      search = await groundedSearch(
        `Trouve la page produit officielle (site de la marque ou Zalando) de : ${q}. Réponds uniquement avec l'URL de la page produit.`,
      );
    } catch {
      throw new HttpError(503, "Recherche automatique indisponible (la recherche web Gemini nécessite la facturation). Colle plutôt le lien du produit.");
    }
    for (const s of search.sources.slice(0, 3)) {
      try {
        const res = await imagesFromPage(s.url);
        if (res.images.length) return Response.json(res);
      } catch { /* page suivante */ }
    }
    throw new HttpError(404, "Photo officielle introuvable automatiquement. Colle le lien du produit.");
  } catch (e) {
    return jsonError(e);
  }
}
