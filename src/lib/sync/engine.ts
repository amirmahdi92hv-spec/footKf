import { db } from "@/db/client";
import { NormMatch, NormScorer, NormStanding, NormCompetition, NormSeason, type ProviderAdapter } from "../providers/types";
import { QuotaExceeded } from "../providers/http";
import { upsertMapped } from "./store";

const nowIso = () => new Date().toISOString();

async function acquireLock(job: string, ttlS: number): Promise<boolean> {
  const c = db();
  const until = new Date(Date.now() + ttlS * 1000).toISOString();
  const r = await c.execute({
    sql: `INSERT INTO sync_locks(job, locked_until) VALUES (?,?)
          ON CONFLICT(job) DO UPDATE SET locked_until=excluded.locked_until WHERE sync_locks.locked_until < ?`,
    args: [job, until, nowIso()],
  });
  return r.rowsAffected > 0;
}
const releaseLock = (job: string) => db().execute({ sql: "DELETE FROM sync_locks WHERE job=?", args: [job] });

export interface SyncResult { status: "ok" | "partial" | "error" | "skipped"; upserted: number; skippedInvalid: number; error?: string }

/** Sync matches + standings for one competition. Failures never delete existing data (last-known-good). */
export async function syncCompetition(p: ProviderAdapter, code: string, range?: { dateFrom: string; dateTo: string }): Promise<SyncResult> {
  const c = db();
  const jobName = `${p.name}:${code}`;
  if (!(await acquireLock(jobName, 120))) return { status: "skipped", upserted: 0, skippedInvalid: 0, error: "job already running" };
  const job = await c.execute({ sql: "INSERT INTO sync_jobs(provider, job, status, started_at) VALUES (?,?,'running',?)", args: [p.name, jobName, nowIso()] });
  const jobId = Number(job.lastInsertRowid);
  let upserted = 0, invalid = 0;
  try {
    const raw = await p.fetchMatches(code, range ?? {});
    const comp = NormCompetition.parse(raw.competition);
    const season = NormSeason.parse(raw.season);
    const compId = await upsertMapped(c, p.name, "competition", comp.pid, { code: comp.code, name: comp.name, country: comp.country, emblem_url: comp.emblemUrl, type: comp.type });
    const seasonId = await upsertMapped(c, p.name, "season", season.pid, { competition_id: compId, start_date: season.startDate, end_date: season.endDate, current_matchday: season.currentMatchday, is_current: 1 });

    const teamId = async (t: { pid: string; name: string; shortName: string | null; tla: string | null; crestUrl: string | null }) =>
      upsertMapped(c, p.name, "team", t.pid, { name: t.name, short_name: t.shortName, tla: t.tla, crest_url: t.crestUrl, updated_at: nowIso() });

    for (const rawMatch of raw.matches) {
      const parsed = NormMatch.safeParse(rawMatch);
      if (!parsed.success) { invalid++; continue; }
      const m = parsed.data;
      const [h, a] = [await teamId(m.homeTeam), await teamId(m.awayTeam)];
      await upsertMapped(c, p.name, "match", m.pid, {
        season_id: seasonId, competition_id: compId, home_team_id: h, away_team_id: a, kickoff_utc: m.kickoffUtc,
        status: m.status, matchday: m.matchday, stage: m.stage, home_score: m.homeScore, away_score: m.awayScore,
        home_ht: m.homeHt, away_ht: m.awayHt, updated_at: nowIso(), provider_updated_at: m.providerUpdatedAt,
      });
      upserted++;
    }

    let standingsFailed = false;
    try {
      const rows = (await p.fetchStandings(code)).map((r) => NormStanding.safeParse(r)).filter((r) => r.success || (invalid++, false)).map((r) => (r as { data: NormStanding }).data);
      if (rows.length) {
        for (const s of rows) {
          const tid = await teamId(s.team);
          await c.execute({
            sql: `INSERT INTO standings(season_id, team_id, position, played, won, draw, lost, goals_for, goals_against, points, form, updated_at)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(season_id, team_id) DO UPDATE SET position=excluded.position, played=excluded.played, won=excluded.won, draw=excluded.draw,
                  lost=excluded.lost, goals_for=excluded.goals_for, goals_against=excluded.goals_against, points=excluded.points, form=excluded.form, updated_at=excluded.updated_at`,
            args: [seasonId, tid, s.position, s.played, s.won, s.draw, s.lost, s.goalsFor, s.goalsAgainst, s.points, s.form, nowIso()],
          });
          upserted++;
        }
      }
    } catch (e) {
      if (e instanceof QuotaExceeded) throw e;
      standingsFailed = true;
    }

    try {
      if (p.fetchScorers) {
        for (const raw of await p.fetchScorers(code)) {
          const sc = NormScorer.safeParse(raw);
          if (!sc.success) { invalid++; continue; }
          const pid = await upsertMapped(c, p.name, "player", sc.data.player.pid, { name: sc.data.player.name, position: sc.data.player.position, nationality: sc.data.player.nationality, birth_date: sc.data.player.birthDate, team_id: await teamId(sc.data.team), updated_at: nowIso() });
          await c.execute({
            sql: `INSERT INTO scorers(season_id, player_id, team_id, goals, assists, penalties, played) VALUES (?,?,?,?,?,?,?)
                  ON CONFLICT(season_id, player_id) DO UPDATE SET team_id=excluded.team_id, goals=excluded.goals, assists=excluded.assists, penalties=excluded.penalties, played=excluded.played`,
            args: [seasonId, pid, await teamId(sc.data.team), sc.data.goals, sc.data.assists, sc.data.penalties, sc.data.played],
          });
          upserted++;
        }
      }
    } catch (e) {
      if (e instanceof QuotaExceeded) throw e; // scorers are optional; other failures keep the old table
    }

    const status = invalid > 0 || standingsFailed ? "partial" : "ok";
    await c.execute({ sql: `INSERT INTO data_freshness(scope, last_ok_at, last_error) VALUES (?,?,NULL)
                            ON CONFLICT(scope) DO UPDATE SET last_ok_at=excluded.last_ok_at, last_error=NULL`, args: [`competition:${compId}`, nowIso()] });
    await c.execute({ sql: "UPDATE sync_jobs SET status=?, finished_at=?, upserted=? WHERE id=?", args: [status, nowIso(), upserted, jobId] });
    return { status, upserted, skippedInvalid: invalid };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await c.execute({ sql: "UPDATE sync_jobs SET status='error', finished_at=?, upserted=?, error=? WHERE id=?", args: [nowIso(), upserted, msg.slice(0, 500), jobId] });
    await c.execute({ sql: `INSERT INTO data_freshness(scope, last_error) VALUES (?,?) ON CONFLICT(scope) DO UPDATE SET last_error=excluded.last_error`, args: [`provider:${p.name}`, msg.slice(0, 500)] });
    return { status: "error", upserted, skippedInvalid: invalid, error: msg };
  } finally {
    await releaseLock(jobName);
  }
}
