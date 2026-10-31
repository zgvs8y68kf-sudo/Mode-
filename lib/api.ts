import "server-only";

export function jsonError(e: unknown, status = 500) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  return Response.json({ error: message }, { status });
}

/** Garde-fou simple contre les requêtes démesurées. */
export async function readBody<T>(req: Request, maxBytes = 3_000_000): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("Requête trop volumineuse");
  return JSON.parse(text) as T;
}
