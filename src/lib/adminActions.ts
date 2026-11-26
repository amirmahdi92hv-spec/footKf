import { z } from "zod";
import { db } from "@/db/client";
import { setOverride, removeOverride, type Entity } from "./sync/store";

const https = z.string().url().refine((u) => u.startsWith("https://"), "https only").max(500);

export const NewsIn = z.object({
  title: z.string().trim().min(3).max(200), summary: z.string().trim().max(400).nullish(),
  source_name: z.string().trim().min(2).max(80), source_url: https, published_at: z.string().datetime().optional(),
});
export const TransferIn = z.object({
  player_name: z.string().trim().min(2).max(100), from_team: z.string().trim().max(100).nullish(), to_team: z.string().trim().max(100).nullish(),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  status: z.enum(["confirmed", "official_announced"]), source_name: z.string().trim().min(2).max(80), source_url: https.nullish(),
});

/** Which fields an admin may hand-correct, and how each value is validated. */
export const OVERRIDABLE: Record<string, { entity: Entity; fields: Record<string, z.ZodType<string | null>> }> = {
  match: { entity: "match", fields: {
    home_score: z.string().regex(/^\d{1,2}$/), away_score: z.string().regex(/^\d{1,2}$/),
    status: z.enum(["scheduled", "live", "paused", "finished", "postponed", "cancelled", "abandoned"]),
    kickoff_utc: z.string().datetime() } },
  team: { entity: "team", fields: { name_fa: z.string().min(1).max(80), crest_url: https, coach_name: z.string().min(1).max(80) } },
  player: { entity: "player", fields: { name_fa: z.string().min(1).max(80), position: z.string().min(1).max(40) } },
  competition: { entity: "competition", fields: { name_fa: z.string().min(1).max(80) } },
};

export async function addNews(raw: unknown, actor: string) {
  const n = NewsIn.parse(raw);
  const r = await db().execute({
    sql: "INSERT OR IGNORE INTO news(title, summary, source_name, source_url, published_at) VALUES (?,?,?,?,?)",
    args: [n.title, n.summary ?? null, n.source_name, n.source_url, n.published_at ?? new Date().toISOString()],
  });
  if (r.rowsAffected) await db().execute({ sql: "INSERT INTO admin_audit(actor, action, target) VALUES (?,?,?)", args: [actor, "news.add", n.source_url] });
  return r.rowsAffected;
}
export async function importNewsJson(text: string, actor: string) {
  const arr = z.array(z.unknown()).max(200).parse(JSON.parse(text));
  let ok = 0, bad = 0;
  for (const x of arr) { try { ok += await addNews(x, actor); } catch { bad++; } }
  return { ok, bad };
}
export async function addTransfer(raw: unknown, actor: string) {
  const t = TransferIn.parse(raw);
  await db().execute({
    sql: "INSERT INTO transfers(player_name, from_team, to_team, transfer_date, status, source_name, source_url, verified_by) VALUES (?,?,?,?,?,?,?,?)",
    args: [t.player_name, t.from_team ?? null, t.to_team ?? null, t.transfer_date ?? null, t.status, t.source_name, t.source_url ?? null, actor],
  });
  await db().execute({ sql: "INSERT INTO admin_audit(actor, action, target) VALUES (?,?,?)", args: [actor, "transfer.add", t.player_name] });
}
export async function applyOverride(o: { kind: string; id: number; field: string; value: string; reason: string }, actor: string) {
  const spec = OVERRIDABLE[o.kind];
  const v = spec?.fields[o.field];
  if (!spec || !v) throw new Error("field not allowed");
  if (!Number.isInteger(o.id) || o.id <= 0) throw new Error("bad id");
  const value = v.parse(o.value);
  const ex = await db().execute({ sql: `SELECT 1 FROM ${{ match: "matches", team: "teams", player: "players", competition: "competitions" }[o.kind]} WHERE id=?`, args: [o.id] });
  if (!ex.rows.length) throw new Error("entity not found");
  const isNum = o.field.endsWith("_score");
  await setOverride(db(), { entity: spec.entity, id: o.id, field: o.field, value: isNum ? String(Number(value)) : value, reason: o.reason.slice(0, 200) || "-", actor });
  if (isNum) await db().execute({ sql: `UPDATE matches SET ${o.field}=? WHERE id=?`, args: [Number(value), o.id] });
}
export async function dropOverride(o: { entity: string; id: number; field: string }, actor: string) {
  await removeOverride(db(), { entity: o.entity as Entity, id: o.id, field: o.field, actor });
}
