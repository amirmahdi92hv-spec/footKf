import { db } from "@/db/client";
import { dayRangeUtc } from "./format";

export interface MatchRow {
  id: number; kickoff_utc: string; status: string; minute: number | null; matchday: number | null;
  home_score: number | null; away_score: number | null; competition_id: number; competition: string;
  home: string; away: string; home_crest: string | null; away_crest: string | null;
}
const MATCH_SQL = `SELECT m.id, m.kickoff_utc, m.status, m.minute, m.matchday, m.home_score, m.away_score, m.competition_id,
  c.name AS competition, h.name AS home, a.name AS away, h.crest_url AS home_crest, a.crest_url AS away_crest
  FROM matches m JOIN competitions c ON c.id=m.competition_id
  JOIN teams h ON h.id=m.home_team_id JOIN teams a ON a.id=m.away_team_id`;

export async function matchesOn(ymd: string, competitionId?: number): Promise<MatchRow[]> {
  const [from, to] = dayRangeUtc(ymd);
  const r = await db().execute({
    sql: `${MATCH_SQL} WHERE m.kickoff_utc >= ? AND m.kickoff_utc < ? ${competitionId ? "AND m.competition_id=?" : ""} ORDER BY m.kickoff_utc, m.id`,
    args: competitionId ? [from, to, competitionId] : [from, to],
  });
  return r.rows as unknown as MatchRow[];
}
export async function liveMatches(): Promise<MatchRow[]> {
  return (await db().execute(`${MATCH_SQL} WHERE m.status IN ('live','paused') ORDER BY m.kickoff_utc`)).rows as unknown as MatchRow[];
}
export async function competitions() {
  return (await db().execute("SELECT id, code, name, country, emblem_url FROM competitions ORDER BY name")).rows;
}
export async function competitionByCode(code: string) {
  return (await db().execute({ sql: "SELECT id, code, name, country FROM competitions WHERE code=?", args: [code] })).rows[0];
}
export async function standingsFor(competitionId: number) {
  return (await db().execute({
    sql: `SELECT s.*, t.name, t.crest_url FROM standings s JOIN teams t ON t.id=s.team_id
          JOIN seasons se ON se.id=s.season_id WHERE se.competition_id=? AND se.is_current=1 ORDER BY s.position`,
    args: [competitionId],
  })).rows;
}
export async function freshness(scope: string) {
  const r = (await db().execute({ sql: "SELECT last_ok_at, last_error FROM data_freshness WHERE scope=?", args: [scope] })).rows[0];
  return { lastOk: r?.last_ok_at ? String(r.last_ok_at) : null, lastError: r?.last_error ? String(r.last_error) : null };
}
export async function latestSync(): Promise<string | null> {
  const r = (await db().execute("SELECT MAX(last_ok_at) t FROM data_freshness")).rows[0];
  return r?.t ? String(r.t) : null;
}
