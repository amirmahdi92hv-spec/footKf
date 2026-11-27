import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./helpers";
import { parseRss, ingestNews, isTransferHeadline } from "@/lib/news";

const XML = `<?xml version="1.0"?><rss><channel>
<item><title><![CDATA[Arsenal &amp; Chelsea draw]]></title><link>https://example.com/a</link><pubDate>Wed, 25 Nov 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>full article text should be ignored</p>]]></description></item>
<item><title>Bad link</title><link>http://insecure.com/x</link><pubDate>Wed, 25 Nov 2026 10:00:00 GMT</pubDate></item>
<item><title>No date here</title><link>https://example.com/c</link></item>
<item><title>Second good one</title><link>https://example.com/d</link><pubDate>Wed, 25 Nov 2026 11:00:00 GMT</pubDate></item>
</channel></rss>`;
let c: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { c = await freshDb(); });

describe("news", () => {
  it("parses headline/link/date only, decodes entities, drops insecure or undated items", () => {
    const it = parseRss(XML);
    expect(it.map((x) => x.title)).toEqual(["Arsenal & Chelsea draw", "Second good one"]);
    expect(JSON.stringify(it)).not.toContain("full article");
  });
  it("ingests idempotently, stores no summary, and throttles repeat runs", async () => {
    const f = (async () => new Response(XML, { status: 200 })) as unknown as typeof fetch;
    const feeds = [{ name: "T", url: "https://x/rss" }];
    expect((await ingestNews(feeds, f)).added).toBe(2);
    expect((await ingestNews(feeds, f, 0)).added).toBe(0);           // duplicates ignored
    expect((await ingestNews(feeds, f)).skipped).toBe(true);          // within 30-minute gap
    const row = (await c.execute("SELECT summary FROM news LIMIT 1")).rows[0];
    expect(row.summary).toBeNull();
  });
  it("a failing feed does not break the others", async () => {
    const f = (async (u: string) => u.includes("bad") ? new Response("", { status: 500 }) : new Response(XML)) as unknown as typeof fetch;
    expect((await ingestNews([{ name: "A", url: "https://bad/rss" }, { name: "B", url: "https://good/rss" }], f)).added).toBe(2);
  });
  it("tags transfer-like headlines only", async () => {
    expect(isTransferHeadline("Arsenal sign striker in £50m deal")).toBe(true);
    expect(isTransferHeadline("Chelsea beat Spurs 2-0")).toBe(false);
    const xml = `<rss><channel><item><title>Club agrees loan move for winger</title><link>https://e.com/1</link><pubDate>Wed, 25 Nov 2026 10:00:00 GMT</pubDate></item><item><title>Late winner secures derby win</title><link>https://e.com/2</link><pubDate>Wed, 25 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
    await ingestNews([{ name: "T", url: "https://x/r" }], (async () => new Response(xml)) as unknown as typeof fetch);
    const r = (await c.execute("SELECT title, category FROM news ORDER BY title")).rows;
    expect(r.find((x) => String(x.title).includes("loan"))?.category).toBe("transfer");
    expect(r.find((x) => String(x.title).includes("derby"))?.category).toBeNull();
  });
});
