import type { ProviderAdapter, MatchStatus } from "./types";
import { cachedGetJson } from "./http";

// football-data.org v4. Free plan: 10 req/min, a limited competition set, delayed live data, non-commercial use.
// Response shapes below follow the public v4 docs; NOT yet verified against the live API from this environment.
const BASE = "https://api.football-data.org/v4";
export const FD_FREE_CODES = ["PL", "PD", "BL1", "SA", "FL1", "CL", "DED", "PPL", "ELC", "BSA", "WC", "EC"];

const STATUS: Record<string, MatchStatus> = {
  SCHEDULED: "scheduled", TIMED: "scheduled", IN_PLAY: "live", PAUSED: "paused", FINISHED: "finished",
  AWARDED: "finished", POSTPONED: "postponed", SUSPENDED: "postponed", CANCELLED: "cancelled",
};
export const mapStatus = (s: string): MatchStatus | null => STATUS[s] ?? null;

type FdTeam = { id: number; name?: string; shortName?: string; tla?: string; crest?: string };
const team = (t: FdTeam) => ({
  pid: String(t.id), name: t.name ?? "", shortName: t.shortName ?? null, tla: t.tla ?? null, crestUrl: t.crest ?? null,
});
const n = (v: unknown) => (typeof v === "number" ? v : null);

export function normalizeMatch(m: any) {
  const status = mapStatus(m.status);
  if (!status) return { error: `unknown status ${m.status}` } as const;
  // Provider fills fullTime during play; keep null when absent rather than inventing 0-0.
  return {
    pid: String(m.id), kickoffUtc: m.utcDate, status,
    matchday: n(m.matchday), stage: m.stage ?? null,
    homeTeam: team(m.homeTeam), awayTeam: team(m.awayTeam),
    homeScore: n(m.score?.fullTime?.home), awayScore: n(m.score?.fullTime?.away),
    homeHt: n(m.score?.halfTime?.home), awayHt: n(m.score?.halfTime?.away),
    providerUpdatedAt: m.lastUpdated ?? null,
  } as const;
}

export function normalizeStanding(r: any) {
  return {
    team: team(r.team), position: r.position, played: r.playedGames, won: r.won, draw: r.draw, lost: r.lost,
    goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst, points: r.points, form: r.form ?? null,
  };
}

export function footballDataAdapter(opts: { apiKey: string; dailyLimit?: number; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> }): ProviderAdapter {
  const get = (path: string, ttl: number) => cachedGetJson({
    provider: "football-data", url: `${BASE}${path}`, headers: { "X-Auth-Token": opts.apiKey },
    ttlSeconds: ttl, dailyLimit: opts.dailyLimit ?? 2000, fetchImpl: opts.fetchImpl, sleep: opts.sleep,
  }) as Promise<any>;
  return {
    name: "football-data",
    competitionCodes: FD_FREE_CODES,
    async fetchMatches(code, { dateFrom, dateTo }) {
      const q = dateFrom && dateTo ? `?dateFrom=${dateFrom}&dateTo=${dateTo}` : "";
      const body = await get(`/competitions/${code}/matches${q}`, 60);
      const s = body.filters?.season ?? body.matches?.[0]?.season;
      const season = body.matches?.[0]?.season ?? s;
      return {
        competition: {
          pid: String(body.competition.id), code: body.competition.code ?? code, name: body.competition.name,
          country: body.competition.area?.name ?? null, emblemUrl: body.competition.emblem ?? null, type: body.competition.type ?? null,
        },
        season: season && { pid: String(season.id), startDate: season.startDate, endDate: season.endDate ?? null, currentMatchday: n(season.currentMatchday) },
        matches: (body.matches ?? []).map(normalizeMatch),
      };
    },
    async fetchStandings(code) {
      const body = await get(`/competitions/${code}/standings`, 600);
      const total = (body.standings ?? []).find((s: any) => s.type === "TOTAL");
      return (total?.table ?? []).map(normalizeStanding);
    },
  };
}
