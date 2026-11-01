import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function jsonError(e: unknown, status = 500) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  return Response.json({ error: message }, { status: e instanceof HttpError ? e.status : status });
}

/** Garde-fou simple contre les requêtes démesurées. */
export async function readBody<T>(req: Request, maxBytes = 3_000_000): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "Requête trop volumineuse");
  return JSON.parse(text) as T;
}

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/**
 * Si Firebase est configuré, seules les personnes connectées peuvent appeler l'IA
 * (vérification du jeton Firebase ID, sans compte de service).
 */
export async function requireUser(req: Request): Promise<string | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new HttpError(401, "Connecte-toi pour utiliser le styliste IA.");
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return payload.sub ?? null;
  } catch {
    throw new HttpError(401, "Session expirée, reconnecte-toi.");
  }
}
