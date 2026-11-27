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
    ttlSeconds: ttl, dailyLimit: opts.dailyLimit ?? 2000, minIntervalMs: opts.fetchImpl ? 0 : 6200, fetchImpl: opts.fetchImpl, sleep: opts.sleep,
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
    async fetchScorers(code) {
      const body = await get(`/competitions/${code}/scorers?limit=15`, 3600);
      return (body.scorers ?? []).map((r: any) => ({
        player: { pid: String(r.player?.id), name: r.player?.name ?? "", position: r.player?.position ?? null, nationality: r.player?.nationality ?? null, birthDate: r.player?.dateOfBirth ?? null },
        team: team(r.team ?? { id: 0 }), goals: r.goals, assists: n(r.assists), penalties: n(r.penalties), played: n(r.playedMatches),
      }));
    },
    async fetchMatchDetail(pid) {
      const m = await get(`/matches/${pid}`, 30);
      const events: unknown[] = [];
      for (const g of m.goals ?? []) events.push({ kind: g.type === "OWN" ? "own_goal" : g.type === "PENALTY" ? "penalty" : "goal",
        minute: n(g.minute), teamPid: g.team?.id != null ? String(g.team.id) : null, player: g.scorer?.name ?? null, related: g.assist?.name ?? null });
      for (const b of m.bookings ?? []) events.push({ kind: b.card === "YELLOW" ? "yellow" : "red",
        minute: n(b.minute), teamPid: b.team?.id != null ? String(b.team.id) : null, player: b.player?.name ?? null, related: null });
      for (const s of m.substitutions ?? []) events.push({ kind: "sub",
        minute: n(s.minute), teamPid: s.team?.id != null ? String(s.team.id) : null, player: s.playerIn?.name ?? null, related: s.playerOut?.name ?? null });
      return { events };
    },
    async fetchTeam(pid) {
      const t = await get(`/teams/${pid}`, 3600);
      return {
        founded: n(t.founded), venue: t.venue ?? null, coach: t.coach?.name ?? null,
        squad: (t.squad ?? []).map((p: any) => ({ pid: String(p.id), name: p.name ?? "", position: p.position ?? null, nationality: p.nationality ?? null, birthDate: p.dateOfBirth ?? null })),
      };
    },
    async fetchStandings(code) {
      const body = await get(`/competitions/${code}/standings`, 600);
      const totals = (body.standings ?? []).filter((s: any) => s.type === "TOTAL");
      if (totals.length !== 1) return []; // group stages have several tables; showing only one would mislead
      return (totals[0].table ?? []).map(normalizeStanding);
    },
  };
}
