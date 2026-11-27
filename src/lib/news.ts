import { db } from "@/db/client";

export interface Feed { name: string; url: string }
export interface FeedItem { title: string; link: string; publishedAt: string }

/** Default feed. Add more via the NEWS_FEEDS env var (JSON: [{"name":"...","url":"https://..."}]) after checking each site's terms. */
export const DEFAULT_FEEDS: Feed[] = [{ name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" }];
export function feedsFromEnv(): Feed[] {
  try {
    const v = JSON.parse(process.env.NEWS_FEEDS ?? "null");
    if (Array.isArray(v)) return v.filter((f) => f?.name && typeof f.url === "string" && f.url.startsWith("https://")).slice(0, 8);
  } catch { /* fall through */ }
  return DEFAULT_FEEDS;
}

const unCdata = (s: string) => s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'");
const tag = (block: string, name: string) => { const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i")); return m ? decode(unCdata(m[1])).replace(/<[^>]+>/g, "").trim() : ""; };

/** Minimal RSS 2.0 parser. Keeps only headline, link and date (no article text is stored). */
export function parseRss(xml: string, limit = 15): FeedItem[] {
  const out: FeedItem[] = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const title = tag(m[0], "title").slice(0, 200), link = tag(m[0], "link"), date = new Date(tag(m[0], "pubDate"));
    if (title.length < 5 || !link.startsWith("https://") || isNaN(date.getTime())) continue;
    out.push({ title, link: link.slice(0, 500), publishedAt: date.toISOString() });
    if (out.length >= limit) break;
  }
  return out;
}

export async function ingestNews(feeds = feedsFromEnv(), f: typeof fetch = fetch, minGapMin = 30): Promise<{ added: number; skipped?: boolean }> {
  const c = db();
  const last = (await c.execute("SELECT last_ok_at FROM data_freshness WHERE scope='news'")).rows[0]?.last_ok_at;
  if (last && Date.now() - new Date(String(last)).getTime() < minGapMin * 60_000) return { added: 0, skipped: true };
  let added = 0, okFeeds = 0;
  for (const feed of feeds) {
    try {
      const res = await f(feed.url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "FootKf/1.0 (news aggregator; links only)" } });
      if (!res.ok) continue;
      const xml = (await res.text()).slice(0, 1_000_000);
      for (const it of parseRss(xml)) {
        const r = await c.execute({ sql: "INSERT OR IGNORE INTO news(title, summary, source_name, source_url, published_at) VALUES (?,?,?,?,?)", args: [it.title, null, feed.name, it.link, it.publishedAt] });
        added += r.rowsAffected;
      }
      okFeeds++;
    } catch { /* one bad feed must not stop the others */ }
  }
  if (okFeeds) await c.execute({ sql: "INSERT INTO data_freshness(scope, last_ok_at) VALUES ('news', ?) ON CONFLICT(scope) DO UPDATE SET last_ok_at=excluded.last_ok_at", args: [new Date().toISOString()] });
  return { added };
}
