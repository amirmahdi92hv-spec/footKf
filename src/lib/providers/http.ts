import { db } from "@/db/client";

export class QuotaExceeded extends Error {}
export class ProviderError extends Error {
  constructor(msg: string, readonly status?: number) { super(msg); }
}

export interface HttpOpts {
  provider: string; url: string; headers?: Record<string, string>;
  ttlSeconds: number;           // cache lifetime; 0 disables
  dailyLimit?: number;          // hard self-imposed cap per UTC day
  maxRetries?: number; timeoutMs?: number;
  minIntervalMs?: number;       // spacing between real (non-cached) calls, e.g. 6200 for a 10 req/min limit
  fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void>;
}

const lastCall = new Map<string, number>();
const today = () => new Date().toISOString().slice(0, 10);

async function bumpUsage(provider: string, limit?: number) {
  const c = db();
  const cur = await c.execute({ sql: "SELECT requests FROM api_usage WHERE provider=? AND day=?", args: [provider, today()] });
  const used = Number(cur.rows[0]?.requests ?? 0);
  if (limit !== undefined && used >= limit) throw new QuotaExceeded(`${provider}: daily budget ${limit} reached`);
  await c.execute({
    sql: `INSERT INTO api_usage(provider, day, requests) VALUES (?,?,1)
          ON CONFLICT(provider, day) DO UPDATE SET requests = requests + 1`,
    args: [provider, today()],
  });
}

/** Cached GET with timeout, retry + exponential backoff on 429/5xx, and per-day request budget. */
export async function cachedGetJson(o: HttpOpts): Promise<unknown> {
  const c = db();
  const now = Math.floor(Date.now() / 1000);
  if (o.ttlSeconds > 0) {
    const hit = await c.execute({ sql: "SELECT body, fetched_at, ttl_s FROM request_cache WHERE key=?", args: [o.url] });
    const r = hit.rows[0];
    if (r && now - Number(r.fetched_at) < Math.min(Number(r.ttl_s), o.ttlSeconds)) return JSON.parse(String(r.body));
  }
  const f = o.fetchImpl ?? fetch;
  const sleep = o.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const max = o.maxRetries ?? 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= max; attempt++) {
    if (o.minIntervalMs) {
      const wait = (lastCall.get(o.provider) ?? 0) + o.minIntervalMs - Date.now();
      if (wait > 0) await sleep(wait);
      lastCall.set(o.provider, Date.now());
    }
    await bumpUsage(o.provider, o.dailyLimit); // every attempt counts against the budget
    try {
      const res = await f(o.url, { headers: o.headers, signal: AbortSignal.timeout(o.timeoutMs ?? 10_000) });
      if (res.ok) {
        const text = await res.text();
        const body = JSON.parse(text);
        if (o.ttlSeconds > 0) {
          await c.execute({
            sql: `INSERT INTO request_cache(key, body, fetched_at, ttl_s) VALUES (?,?,?,?)
                  ON CONFLICT(key) DO UPDATE SET body=excluded.body, fetched_at=excluded.fetched_at, ttl_s=excluded.ttl_s`,
            args: [o.url, text, now, o.ttlSeconds],
          });
        }
        return body;
      }
      if (res.status !== 429 && res.status < 500) throw new ProviderError(`HTTP ${res.status}`, res.status); // not retryable
      const retryAfter = Number(res.headers.get("retry-after"));
      lastErr = new ProviderError(`HTTP ${res.status}`, res.status);
      if (attempt < max) await sleep(retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
    } catch (e) {
      if (e instanceof ProviderError && e.status && e.status < 500 && e.status !== 429) throw e;
      if (e instanceof QuotaExceeded) throw e;
      lastErr = e;
      if (attempt < max) await sleep(1000 * 2 ** attempt);
    }
  }
  throw lastErr instanceof Error ? lastErr : new ProviderError("request failed");
}
