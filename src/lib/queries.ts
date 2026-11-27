import { db } from "@/db/client";
import { dayRangeUtc } from "./format";

export interface MatchRow {
  id: number; kickoff_utc: string; status: string; minute: number | null; matchday: number | null;
  home_score: number | null; away_score: number | null; competition_id: number; competition: string;
  home: string; away: string; home_id: number; away_id: number; home_fa: string | null; away_fa: string | null; comp_code: string | null; venue: string | null; home_crest: string | null; away_crest: string | null;
}
const MATCH_SQL = `SELECT m.id, m.kickoff_utc, m.status, m.minute, m.matchday, m.home_score, m.away_score, m.competition_id,
  c.name AS competition, c.code AS comp_code, h.venue AS venue, h.name_fa AS home_fa, a.name_fa AS away_fa, m.home_team_id AS home_id, m.away_team_id AS away_id, h.name AS home, a.name AS away, h.crest_url AS home_crest, a.crest_url AS away_crest
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

export const matchById = async (id: number) => (await db().execute({ sql: `${MATCH_SQL} WHERE m.id=?`, args: [id] })).rows[0] as unknown as MatchRow | undefined;
export const eventsFor = async (id: number) => (await db().execute({ sql: "SELECT * FROM match_events WHERE match_id=? ORDER BY COALESCE(minute,999), id", args: [id] })).rows;
export const teamById = async (id: number) => (await db().execute({ sql: "SELECT * FROM teams WHERE id=?", args: [id] })).rows[0];
export const squadOf = async (id: number) => (await db().execute({ sql: "SELECT id, name, position, nationality FROM players WHERE team_id=? ORDER BY position, name", args: [id] })).rows;
export const playerById = async (id: number) => (await db().execute({ sql: "SELECT p.*, t.name AS team_name FROM players p LEFT JOIN teams t ON t.id=p.team_id WHERE p.id=?", args: [id] })).rows[0];
export async function teamMatches(id: number, upcoming: boolean): Promise<MatchRow[]> {
  const now = new Date().toISOString();
  return (await db().execute({
    sql: `${MATCH_SQL} WHERE (m.home_team_id=? OR m.away_team_id=?) AND m.kickoff_utc ${upcoming ? ">=" : "<"} ? ORDER BY m.kickoff_utc ${upcoming ? "ASC" : "DESC"} LIMIT 5`,
    args: [id, id, now],
  })).rows as unknown as MatchRow[];
}
export const teamStanding = async (id: number) => (await db().execute({
  sql: `SELECT s.position, s.points, c.name AS competition FROM standings s JOIN seasons se ON se.id=s.season_id JOIN competitions c ON c.id=se.competition_id WHERE s.team_id=? AND se.is_current=1`, args: [id] })).rows[0];
export const transfersList = async () => (await db().execute("SELECT * FROM transfers ORDER BY COALESCE(transfer_date, created_at) DESC LIMIT 100")).rows;
export const newsList = async () => (await db().execute("SELECT * FROM news WHERE is_published=1 ORDER BY published_at DESC LIMIT 50")).rows;
export const topScorers = async (competitionId: number) => (await db().execute({
  sql: `SELECT sc.goals, sc.assists, p.id, p.name, t.name AS team FROM scorers sc JOIN players p ON p.id=sc.player_id LEFT JOIN teams t ON t.id=sc.team_id
        JOIN seasons se ON se.id=sc.season_id WHERE se.competition_id=? AND se.is_current=1 ORDER BY sc.goals DESC LIMIT 15`, args: [competitionId] })).rows;
export async function search(q: string) {
  const like = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
  const [teams, players, comps] = await Promise.all([
    db().execute({ sql: "SELECT id, name FROM teams WHERE name LIKE ? ESCAPE '\\' OR name_fa LIKE ? ESCAPE '\\' LIMIT 10", args: [like, like] }),
    db().execute({ sql: "SELECT id, name FROM players WHERE name LIKE ? ESCAPE '\\' OR name_fa LIKE ? ESCAPE '\\' LIMIT 10", args: [like, like] }),
    db().execute({ sql: "SELECT code, name FROM competitions WHERE name LIKE ? ESCAPE '\\' OR name_fa LIKE ? ESCAPE '\\' LIMIT 10", args: [like, like] }),
  ]);
  return { teams: teams.rows, players: players.rows, comps: comps.rows };
}

export async function matchesRange(fromYmd: string, toYmd: string): Promise<MatchRow[]> {
  const [from] = dayRangeUtc(fromYmd); const [, to] = dayRangeUtc(toYmd);
  return (await db().execute({ sql: `${MATCH_SQL} WHERE m.kickoff_utc >= ? AND m.kickoff_utc < ? ORDER BY m.kickoff_utc, m.id`, args: [from, to] })).rows as unknown as MatchRow[];
}
export async function nextMatch(): Promise<MatchRow | undefined> {
  const r = await db().execute({ sql: `${MATCH_SQL} WHERE m.status IN ('scheduled') AND m.kickoff_utc >= ? ORDER BY m.kickoff_utc LIMIT 1`, args: [new Date().toISOString()] });
  return r.rows[0] as unknown as MatchRow | undefined;
}
export async function competitionsWithMatchesOn(ymd: string) {
  const [from, to] = dayRangeUtc(ymd);
  return (await db().execute({ sql: "SELECT DISTINCT c.id, c.code, c.name FROM matches m JOIN competitions c ON c.id=m.competition_id WHERE m.kickoff_utc >= ? AND m.kickoff_utc < ? ORDER BY c.name", args: [from, to] })).rows;
}
/** Last results (W/D/L) for a team, newest first, derived only from finished matches we hold. */
export async function formOf(teamId: number, limit = 5): Promise<("W" | "D" | "L")[]> {
  const r = await db().execute({ sql: "SELECT home_team_id h, home_score hs, away_score a FROM matches WHERE (home_team_id=? OR away_team_id=?) AND status='finished' AND home_score IS NOT NULL AND away_score IS NOT NULL ORDER BY kickoff_utc DESC LIMIT ?", args: [teamId, teamId, limit] });
  return r.rows.map((x) => { const mine = Number(x.h) === teamId ? Number(x.hs) : Number(x.a), theirs = Number(x.h) === teamId ? Number(x.a) : Number(x.hs); return mine > theirs ? "W" : mine < theirs ? "L" : "D"; });
}
export async function headToHead(a: number, b: number): Promise<MatchRow[]> {
  return (await db().execute({ sql: `${MATCH_SQL} WHERE m.status='finished' AND ((m.home_team_id=? AND m.away_team_id=?) OR (m.home_team_id=? AND m.away_team_id=?)) ORDER BY m.kickoff_utc DESC LIMIT 5`, args: [a, b, b, a] })).rows as unknown as MatchRow[];
}
export async function featuredCompetition() {
  return (await db().execute("SELECT c.id, c.code, c.name FROM competitions c JOIN seasons se ON se.competition_id=c.id AND se.is_current=1 JOIN standings s ON s.season_id=se.id GROUP BY c.id ORDER BY COUNT(*) DESC LIMIT 1")).rows[0];
}
export async function standingsWithTeams(competitionId: number) {
  return (await db().execute({ sql: `SELECT s.*, t.name, t.name_fa, t.crest_url FROM standings s JOIN teams t ON t.id=s.team_id JOIN seasons se ON se.id=s.season_id WHERE se.competition_id=? AND se.is_current=1 ORDER BY s.position`, args: [competitionId] })).rows;
}
export async function competitionMatches(competitionId: number, limit = 60): Promise<MatchRow[]> {
  return (await db().execute({ sql: `${MATCH_SQL} WHERE m.competition_id=? ORDER BY m.kickoff_utc DESC LIMIT ?`, args: [competitionId, limit] })).rows as unknown as MatchRow[];
}

export const squadChanges = async () => (await db().execute(
  `SELECT sc.id, sc.detected_at, p.id AS player_id, p.name AS player, f.name AS from_name, f.name_fa AS from_fa, t.name AS to_name, t.name_fa AS to_fa, f.id AS from_id, t.id AS to_id
   FROM squad_changes sc JOIN players p ON p.id=sc.player_id JOIN teams f ON f.id=sc.from_team_id JOIN teams t ON t.id=sc.to_team_id
   ORDER BY sc.detected_at DESC LIMIT 40`)).rows;
export const playerSeasonStats = async (playerId: number) => (await db().execute({
  sql: `SELECT sc.goals, sc.assists, sc.penalties, sc.played, c.name AS competition, c.code FROM scorers sc JOIN seasons se ON se.id=sc.season_id JOIN competitions c ON c.id=se.competition_id WHERE sc.player_id=? AND se.is_current=1`, args: [playerId] })).rows;

export const transferNews = async () => (await db().execute("SELECT * FROM news WHERE is_published=1 AND category='transfer' ORDER BY published_at DESC LIMIT 20")).rows;
