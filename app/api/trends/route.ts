import { currentTrends } from "@/lib/gemini";
import { jsonError } from "@/lib/api";

export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const sex = new URL(req.url).searchParams.get("sex") ?? "mixte";
    return Response.json(await currentTrends(sex));
  } catch (e) {
    return jsonError(e);
  }
}
