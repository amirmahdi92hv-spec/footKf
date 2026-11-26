import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./helpers";
import { cachedGetJson, QuotaExceeded } from "@/lib/providers/http";

beforeEach(async () => { await freshDb(); });
const res = (status: number, body = "{}") => new Response(body, { status });
const base = { provider: "p", url: "https://x/y", ttlSeconds: 60, sleep: async () => {} };

describe("http layer", () => {
  it("retries 429/5xx with exponential backoff then succeeds", async () => {
    const waits: number[] = []; let n = 0;
    const out = await cachedGetJson({ ...base, sleep: async (ms) => { waits.push(ms); },
      fetchImpl: (async () => (++n < 3 ? res(429) : res(200, '{"ok":1}'))) as typeof fetch });
    expect(out).toEqual({ ok: 1 });
    expect(waits).toEqual([1000, 2000]);
  });
  it("does not retry 4xx client errors", async () => {
    let n = 0;
    await expect(cachedGetJson({ ...base, fetchImpl: (async () => (n++, res(403))) as typeof fetch })).rejects.toThrow("403");
    expect(n).toBe(1);
  });
  it("serves from cache within ttl without a second request", async () => {
    let n = 0; const f = (async () => (n++, res(200, '{"a":1}'))) as typeof fetch;
    await cachedGetJson({ ...base, fetchImpl: f }); await cachedGetJson({ ...base, fetchImpl: f });
    expect(n).toBe(1);
  });
  it("enforces the daily budget", async () => {
    const f = (async () => res(200)) as typeof fetch;
    await cachedGetJson({ ...base, url: "https://x/1", ttlSeconds: 0, dailyLimit: 1, fetchImpl: f });
    await expect(cachedGetJson({ ...base, url: "https://x/2", ttlSeconds: 0, dailyLimit: 1, fetchImpl: f })).rejects.toBeInstanceOf(QuotaExceeded);
  });
});
