import { timingSafeEqual } from "node:crypto";
import { db } from "@/db/client";
import { footballDataAdapter, FD_FREE_CODES } from "@/lib/providers/footballData";
import { syncCompetition } from "@/lib/sync/engine";
import { syncMatchDetail, syncTeam } from "@/lib/sync/detail";
import { ingestNews } from "@/lib/news";
import { liveMatches } from "@/lib/queries";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ok = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const day = (off: number) => new Date(Date.now() + off * 864e5).toISOString().slice(0, 10);

/** Competitions to refresh now: those with live/imminent matches first, then the least recently synced. */
async function pickCodes(max: number): Promise<string[]> {
  const c = db();
  const now = Date.now();
  const hot = (await c.execute({
    sql: `SELECT DISTINCT c.code FROM matches m JOIN competitions c ON c.id=m.competition_id
          WHERE m.status IN ('live','paused') OR (m.kickoff_utc BETWEEN ? AND ?)`,
    args: [new Date(now - 3 * 36e5).toISOString(), new Date(now + 36e5).toISOString()],
  })).rows.map((r) => String(r.code)).filter((x) => FD_FREE_CODES.includes(x));
  const last = new Map((await c.execute("SELECT job, MAX(started_at) t FROM sync_jobs WHERE provider='football-data' GROUP BY job")).rows.map((r) => [String(r.job).split(":")[1], String(r.t)]));
  const cold = FD_FREE_CODES.filter((x) => !hot.includes(x)).sort((a, b) => (last.get(a) ?? "").localeCompare(last.get(b) ?? ""));
  return [...hot, ...cold].slice(0, max);
}

/** Called by an external scheduler. Time-budgeted so it finishes inside the serverless limit and the 10 req/min free quota. */
export async function POST(req: Request) {
  const t0 = Date.now(), elapsed = () => Date.now() - t0;
  const secret = process.env.CRON_SECRET, key = process.env.FOOTBALL_DATA_API_KEY;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!secret || secret.length < 24 || !ok(given, secret)) return new Response("unauthorized", { status: 401 });
  const out: Record<string, unknown> = {};
  const p = key ? footballDataAdapter({ apiKey: key }) : null;

  if (p) {
    const param = new URL(req.url).searchParams.get("codes");
    const codes = (param && param !== "auto" ? param.split(",").filter((x) => p.competitionCodes.includes(x)).slice(0, 3) : await pickCodes(2));
    const range = { dateFrom: day(-3), dateTo: day(7) };
    for (const code of codes) {
      if (elapsed() > 28_000) { out[code] = "deferred"; continue; }
      out[code] = await syncCompetition(p, code, range);
    }
    let events = 0;
    for (const m of (await liveMatches()).slice(0, 2)) {
      if (elapsed() > 46_000) break;
      try { events += await syncMatchDetail(p, m.id); } catch { /* keep stored events */ }
    }
    out.events = events;
    // squads for teams that have none yet (1 request each, as time allows)
    const empty = (await db().execute("SELECT t.id FROM teams t WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.team_id=t.id) ORDER BY t.id LIMIT 3")).rows;
    let squads = 0;
    for (const t of empty) {
      if (elapsed() > 46_000) break;
      try { squads += (await syncTeam(p, Number(t.id))) > 0 ? 1 : 0; } catch { /* retry next run */ }
    }
    out.squads = squads;
  } else out.football = "FOOTBALL_DATA_API_KEY not set";

  try { out.news = await ingestNews(); } catch (e) { out.news = { error: e instanceof Error ? e.message : "failed" }; }
  out.seconds = Math.round(elapsed() / 1000);
  return Response.json(out);
}
