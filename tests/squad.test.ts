import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./helpers";
import { syncTeam } from "@/lib/sync/detail";
import { upsertMapped } from "@/lib/sync/store";
import type { ProviderAdapter } from "@/lib/providers/types";

let c: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { c = await freshDb(); });
const adapter = (squad: unknown[]): ProviderAdapter => ({ name: "fake", competitionCodes: [], fetchMatches: async () => ({ competition: {}, season: {}, matches: [] }), fetchStandings: async () => [],
  fetchTeam: async () => ({ founded: 1900, venue: "V", coach: "C", squad }) });
const pl = (pid: string) => ({ pid, name: "Player " + pid, position: "Offence", nationality: "X", birthDate: null });

describe("squad change detection", () => {
  it("records a change when a known player shows up in another team, but not on first sight or repeats", async () => {
    const a = await upsertMapped(c, "fake", "team", "1", { name: "A" });
    const b = await upsertMapped(c, "fake", "team", "2", { name: "B" });
    await syncTeam(adapter([pl("9")]), a);                       // first sight: no change
    expect(Number((await c.execute("SELECT COUNT(*) n FROM squad_changes")).rows[0].n)).toBe(0);
    await syncTeam(adapter([pl("9")]), b);                       // moved A -> B
    await syncTeam(adapter([pl("9")]), b);                       // repeat: no duplicate
    const rows = (await c.execute("SELECT from_team_id f, to_team_id t FROM squad_changes")).rows;
    expect(rows).toHaveLength(1);
    expect([Number(rows[0].f), Number(rows[0].t)]).toEqual([a, b]);
  });
});
