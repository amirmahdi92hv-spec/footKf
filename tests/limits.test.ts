import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./helpers";
import { cachedGetJson } from "@/lib/providers/http";
import { footballDataAdapter } from "@/lib/providers/footballData";

beforeEach(async () => { await freshDb(); });
describe("rate spacing and group guard", () => {
  it("waits between real calls but not for cache hits", async () => {
    const waits: number[] = []; const f = (async () => new Response("{}")) as unknown as typeof fetch;
    const o = { provider: "spacing-test", ttlSeconds: 60, minIntervalMs: 6200, fetchImpl: f, sleep: async (ms: number) => { waits.push(ms); } };
    await cachedGetJson({ ...o, url: "https://x/1" });
    await cachedGetJson({ ...o, url: "https://x/2" });
    await cachedGetJson({ ...o, url: "https://x/2" }); // cache hit
    expect(waits.length).toBe(1);
    expect(waits[0]).toBeGreaterThan(5000);
  });
  it("returns no standings for multi-group competitions instead of one misleading table", async () => {
    const body = { standings: [{ type: "TOTAL", table: [{ team: { id: 1 }, position: 1 }] }, { type: "TOTAL", table: [{ team: { id: 2 }, position: 1 }] }] };
    const p = footballDataAdapter({ apiKey: "k", fetchImpl: (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch });
    expect(await p.fetchStandings("WC")).toEqual([]);
  });
});
