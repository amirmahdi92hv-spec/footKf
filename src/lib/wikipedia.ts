// Player bios from Wikipedia (text is CC BY-SA 4.0: always shown with attribution + link). Server-side, cached 24h.
export interface Bio { text: string; lang: "fa" | "en"; url: string; title: string }
type F = typeof fetch;
const get = async (f: F, url: string) => {
  try {
    const r = await f(url, { signal: AbortSignal.timeout(4000), headers: { "User-Agent": "FootKf/1.0 (football info site)", Accept: "application/json" }, next: { revalidate: 86400 } } as RequestInit);
    return r.ok ? await r.json() : null;
  } catch { return null; }
};
const FOOTY = /football|soccer|goalkeeper|striker|midfielder|defender|winger|forward/i;

export async function playerBio(name: string, f: F = fetch): Promise<Bio | null> {
  const clean = name.trim();
  if (clean.length < 3) return null;
  const en = await get(f, `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean.replace(/ /g, "_"))}?redirect=true`);
  // Guard against wrong people / disambiguation pages: require a football-related description.
  if (!en || en.type !== "standard" || !FOOTY.test(`${en.description ?? ""} ${en.extract ?? ""}`.slice(0, 400))) return null;
  const ll = await get(f, `https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=fa&titles=${encodeURIComponent(en.title)}&redirects=1&format=json&origin=*`);
  const page = ll?.query?.pages ? (Object.values(ll.query.pages)[0] as { langlinks?: { "*": string }[] }) : undefined;
  const faTitle = page?.langlinks?.[0]?.["*"];
  if (faTitle) {
    const fa = await get(f, `https://fa.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(faTitle.replace(/ /g, "_"))}`);
    if (fa?.type === "standard" && fa.extract) return { text: String(fa.extract).slice(0, 900), lang: "fa", url: fa.content_urls?.desktop?.page ?? `https://fa.wikipedia.org/wiki/${encodeURIComponent(faTitle)}`, title: fa.title };
  }
  return { text: String(en.extract ?? "").slice(0, 700), lang: "en", url: en.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(en.title)}`, title: en.title };
}
