import { timingSafeEqual } from "node:crypto";
import { footballDataAdapter } from "@/lib/providers/footballData";
import { syncCompetition } from "@/lib/sync/engine";
import { liveMatches, matchesOn } from "@/lib/queries";
import { todayYmd } from "@/lib/format";
export const dynamic = "force-dynamic";

const ok = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Called by an external scheduler (GitHub Actions cron). Syncs a small window per competition to respect the 10 req/min free limit. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET, key = process.env.FOOTBALL_DATA_API_KEY;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!secret || secret.length < 24 || !ok(given, secret)) return new Response("unauthorized", { status: 401 });
  if (!key) return Response.json({ error: "provider not configured" }, { status: 503 });
  const codes = (new URL(req.url).searchParams.get("codes") ?? "PL").split(",").slice(0, 3);
  const p = footballDataAdapter({ apiKey: key });
  const from = todayYmd(), to = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const results: Record<string, unknown> = {};
  for (const code of codes) { if (!p.competitionCodes.includes(code)) continue; results[code] = await syncCompetition(p, code, { dateFrom: from, dateTo: to }); }
  return Response.json(results);
}
