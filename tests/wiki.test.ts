import { describe, it, expect } from "vitest";
import { playerBio } from "@/lib/wikipedia";
const J = (o: unknown) => new Response(JSON.stringify(o), { status: 200 });
describe("playerBio", () => {
  it("prefers the Persian article and keeps attribution url", async () => {
    const f = (async (u: string) => u.includes("en.wikipedia.org/api/rest_v1") ? J({ type: "standard", title: "Bukayo Saka", description: "English footballer", extract: "x" })
      : u.includes("w/api.php") ? J({ query: { pages: { "1": { langlinks: [{ "*": "بوکایو ساکا" }] } } } })
      : J({ type: "standard", title: "بوکایو ساکا", extract: "بازیکن فوتبال", content_urls: { desktop: { page: "https://fa.wikipedia.org/wiki/x" } } })) as unknown as typeof fetch;
    const b = await playerBio("Bukayo Saka", f);
    expect(b?.lang).toBe("fa"); expect(b?.url).toContain("fa.wikipedia.org");
  });
  it("rejects non-football pages and disambiguations; survives network failure", async () => {
    expect(await playerBio("John Smith", (async () => J({ type: "standard", title: "John Smith", description: "English painter", extract: "painter" })) as unknown as typeof fetch)).toBeNull();
    expect(await playerBio("John Smith", (async () => J({ type: "disambiguation", title: "x" })) as unknown as typeof fetch)).toBeNull();
    expect(await playerBio("John Smith", (async () => { throw new Error("net"); }) as unknown as typeof fetch)).toBeNull();
  });
});
