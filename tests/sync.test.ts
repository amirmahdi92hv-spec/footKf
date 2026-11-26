import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./helpers";
import { syncCompetition } from "@/lib/sync/engine";
import { setOverride, removeOverride } from "@/lib/sync/store";
import { normalizeMatch, mapStatus } from "@/lib/providers/footballData";
import type { ProviderAdapter } from "@/lib/providers/types";

const t = (id: number, name: string) => ({ pid: String(id), name, shortName: null, tla: null, crestUrl: null });
const match = (id: string, over: object = {}) => ({
  pid: id, kickoffUtc: "2026-11-28T15:00:00Z", status: "scheduled", matchday: 1, stage: "REGULAR_SEASON",
  homeTeam: t(1, "A"), awayTeam: t(2, "B"), homeScore: null, awayScore: null, homeHt: null, awayHt: null, providerUpdatedAt: null, ...over,
});
const fake = (matches: unknown[], fail = false): ProviderAdapter => ({
  name: "fake", competitionCodes: ["X"],
  async fetchMatches() {
    if (fail) throw new Error("provider down");
    return { competition: { pid: "10", code: "X", name: "Test League", country: null, emblemUrl: null, type: "LEAGUE" },
             season: { pid: "20", startDate: "2026-08-01", endDate: null, currentMatchday: 1 }, matches };
  },
  async fetchStandings() { return []; },
});

let c: Awaited<ReturnType<typeof freshDb>>;
const count = async (tbl: string) => Number((await c.execute(`SELECT COUNT(*) n FROM ${tbl}`)).rows[0].n);
beforeEach(async () => { c = await freshDb(); });

describe("status normalization", () => {
  it("maps provider states and rejects unknown ones", () => {
    expect(mapStatus("TIMED")).toBe("scheduled");
    expect(mapStatus("IN_PLAY")).toBe("live");
    expect(mapStatus("SUSPENDED")).toBe("postponed");
    expect(normalizeMatch({ id: 1, status: "WEIRD" })).toHaveProperty("error");
  });
  it("keeps missing scores as null, never 0", () => {
    const m: any = normalizeMatch({ id: 1, utcDate: "x", status: "SCHEDULED", homeTeam: { id: 1 }, awayTeam: { id: 2 }, score: { fullTime: { home: null, away: null } } });
    expect(m.homeScore).toBeNull();
  });
});

describe("sync engine", () => {
  it("is idempotent: re-running creates no duplicates", async () => {
    const p = fake([match("100"), match("101", { homeTeam: t(3, "C") })]);
    await syncCompetition(p, "X");
    const after1 = [await count("matches"), await count("teams"), await count("provider_mappings")];
    await syncCompetition(p, "X");
    expect([await count("matches"), await count("teams"), await count("provider_mappings")]).toEqual(after1);
    expect(after1[0]).toBe(2);
  });

  it("skips invalid rows individually and reports partial", async () => {
    const r = await syncCompetition(fake([match("1"), match("2", { homeTeam: t(1, "A"), awayTeam: t(1, "A") }), match("3", { status: "scheduled", homeScore: 2 })]), "X");
    expect(r.status).toBe("partial");
    expect(r.skippedInvalid).toBe(2);
    expect(await count("matches")).toBe(1);
  });

  it("preserves last-known-good data when the provider fails", async () => {
    await syncCompetition(fake([match("1")]), "X");
    const r = await syncCompetition(fake([], true), "X");
    expect(r.status).toBe("error");
    expect(await count("matches")).toBe(1);
    const job = (await c.execute("SELECT status FROM sync_jobs ORDER BY id DESC LIMIT 1")).rows[0];
    expect(job.status).toBe("error");
  });

  it("manual override beats sync until removed", async () => {
    await syncCompetition(fake([match("1", { status: "finished", homeScore: 1, awayScore: 0 })]), "X");
    const id = Number((await c.execute("SELECT id FROM matches")).rows[0].id);
    await setOverride(c, { entity: "match", id, field: "home_score", value: null, reason: "provider wrong", actor: "admin" });
    await c.execute({ sql: "UPDATE manual_overrides SET value='3' WHERE entity_id=?", args: [id] });
    await c.execute({ sql: "UPDATE matches SET home_score=3 WHERE id=?", args: [id] });
    await syncCompetition(fake([match("1", { status: "finished", homeScore: 1, awayScore: 0 })]), "X");
    let row = (await c.execute({ sql: "SELECT home_score, away_score FROM matches WHERE id=?", args: [id] })).rows[0];
    expect(Number(row.home_score)).toBe(3);   // overridden field kept
    await removeOverride(c, { entity: "match", id, field: "home_score", actor: "admin" });
    await syncCompetition(fake([match("1", { status: "finished", homeScore: 1, awayScore: 0 })]), "X");
    row = (await c.execute({ sql: "SELECT home_score FROM matches WHERE id=?", args: [id] })).rows[0];
    expect(Number(row.home_score)).toBe(1);   // sync resumes
    expect(await count("admin_audit")).toBe(2);
  });

  it("refuses concurrent runs of the same job", async () => {
    await c.execute({ sql: "INSERT INTO sync_locks(job, locked_until) VALUES ('fake:X', ?)", args: [new Date(Date.now() + 60000).toISOString()] });
    expect((await syncCompetition(fake([match("1")]), "X")).status).toBe("skipped");
  });
});

describe("scorers", () => {
  it("stores scorers idempotently", async () => {
    const p = { ...fake([match("1")]), async fetchScorers() { return [{ player: { pid: "7", name: "P One", position: null, nationality: null, birthDate: null }, team: t(1, "A"), goals: 5, assists: null, penalties: null, played: 3 }, { bad: true }]; } };
    await syncCompetition(p, "X"); await syncCompetition(p, "X");
    expect(await count("scorers")).toBe(1);
    expect(Number((await c.execute("SELECT goals FROM scorers")).rows[0].goals)).toBe(5);
  });
});
