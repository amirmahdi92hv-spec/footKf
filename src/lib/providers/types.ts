import { z } from "zod";

export const MatchStatus = z.enum(["scheduled", "live", "paused", "finished", "postponed", "cancelled", "abandoned"]);
export type MatchStatus = z.infer<typeof MatchStatus>;

const nullableInt = z.number().int().nonnegative().nullable();

export const NormTeam = z.object({
  pid: z.string(), name: z.string().min(1), shortName: z.string().nullable(), tla: z.string().nullable(),
  crestUrl: z.string().url().nullable(),
});
export const NormCompetition = z.object({
  pid: z.string(), code: z.string().nullable(), name: z.string().min(1), country: z.string().nullable(),
  emblemUrl: z.string().url().nullable(), type: z.string().nullable(),
});
export const NormSeason = z.object({
  pid: z.string(), startDate: z.string(), endDate: z.string().nullable(), currentMatchday: z.number().int().nullable(),
});
export const NormMatch = z.object({
  pid: z.string(), kickoffUtc: z.string().datetime(), status: MatchStatus,
  matchday: z.number().int().nullable(), stage: z.string().nullable(),
  homeTeam: NormTeam, awayTeam: NormTeam,
  homeScore: nullableInt, awayScore: nullableInt, homeHt: nullableInt, awayHt: nullableInt,
  providerUpdatedAt: z.string().nullable(),
}).refine((m) => m.homeTeam.pid !== m.awayTeam.pid, "home and away team identical")
  .refine((m) => m.status !== "scheduled" || m.homeScore === null, "scheduled match cannot have a score");
export const NormStanding = z.object({
  team: NormTeam, position: z.number().int().positive(), played: z.number().int(), won: z.number().int(),
  draw: z.number().int(), lost: z.number().int(), goalsFor: z.number().int(), goalsAgainst: z.number().int(),
  points: z.number().int(), form: z.string().nullable(),
});
export type NormMatch = z.infer<typeof NormMatch>;
export type NormTeam = z.infer<typeof NormTeam>;
export type NormStanding = z.infer<typeof NormStanding>;

export interface CompetitionSnapshot {
  competition: z.infer<typeof NormCompetition>;
  season: z.infer<typeof NormSeason>;
  matches: unknown[]; // validated by the sync engine, so bad rows can be skipped individually
  standings: unknown[];
}

export interface ProviderAdapter {
  readonly name: string;
  /** Competitions this provider is configured to serve (verified list lives in config). */
  readonly competitionCodes: string[];
  fetchMatches(code: string, opts: { dateFrom?: string; dateTo?: string }): Promise<{ competition: unknown; season: unknown; matches: unknown[] }>;
  fetchStandings(code: string): Promise<unknown[]>;
}
