import type { MetadataRoute } from "next";
import { db } from "@/db/client";
import { SITE_URL } from "@/lib/site";
export const dynamic = "force-dynamic";

/** Only pages with real content: competitions with standings, teams, and players that have season stats. Empty pages are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = db();
  const [comps, teams, players] = await Promise.all([
    c.execute("SELECT DISTINCT c.code FROM competitions c JOIN seasons se ON se.competition_id=c.id JOIN standings s ON s.season_id=se.id WHERE c.code IS NOT NULL"),
    c.execute("SELECT id, updated_at FROM teams ORDER BY id LIMIT 3000"),
    c.execute("SELECT DISTINCT p.id, p.updated_at FROM players p JOIN scorers sc ON sc.player_id=p.id LIMIT 2000"),
  ]);
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = ["", "/matches", "/competitions", "/transfers", "/news"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: p === "" || p === "/matches" ? "hourly" : "daily", priority: p === "" ? 1 : 0.8 }));
  const d = (v: unknown) => (v ? new Date(String(v)) : now);
  return [
    ...fixed,
    ...comps.rows.map((r) => ({ url: `${SITE_URL}/competitions/${r.code}`, lastModified: now, changeFrequency: "hourly" as const, priority: 0.9 })),
    ...teams.rows.map((r) => ({ url: `${SITE_URL}/teams/${r.id}`, lastModified: d(r.updated_at), changeFrequency: "daily" as const, priority: 0.6 })),
    ...players.rows.map((r) => ({ url: `${SITE_URL}/players/${r.id}`, lastModified: d(r.updated_at), changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
