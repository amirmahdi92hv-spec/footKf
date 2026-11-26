import type { Client, InValue } from "@libsql/client";

export type Entity = "competition" | "season" | "team" | "player" | "match";
const TABLE: Record<Entity, string> = { competition: "competitions", season: "seasons", team: "teams", player: "players", match: "matches" };

/** Field names are internal constants (never user input), but we still whitelist identifiers. */
const ident = (s: string) => { if (!/^[a-z_]+$/.test(s)) throw new Error(`bad identifier ${s}`); return s; };

export async function overridesFor(c: Client, entity: Entity, id: number): Promise<Map<string, string | null>> {
  const r = await c.execute({ sql: "SELECT field, value FROM manual_overrides WHERE entity=? AND entity_id=?", args: [entity, id] });
  return new Map(r.rows.map((x) => [String(x.field), x.value === null ? null : String(x.value)]));
}

/**
 * Idempotent upsert keyed on (provider, entity, providerId). Overridden fields are never written by sync.
 * Returns the internal id. Re-running with the same input creates no duplicates.
 */
export async function upsertMapped(
  c: Client, provider: string, entity: Entity, providerId: string, fields: Record<string, InValue>,
): Promise<number> {
  const table = ident(TABLE[entity]);
  const m = await c.execute({ sql: "SELECT internal_id FROM provider_mappings WHERE provider=? AND entity=? AND provider_id=?", args: [provider, entity, providerId] });
  if (m.rows[0]) {
    const id = Number(m.rows[0].internal_id);
    const ov = await overridesFor(c, entity, id);
    const keys = Object.keys(fields).filter((k) => !ov.has(k));
    if (keys.length) {
      await c.execute({ sql: `UPDATE ${table} SET ${keys.map((k) => `${ident(k)}=?`).join(",")} WHERE id=?`, args: [...keys.map((k) => fields[k]), id] });
    }
    return id;
  }
  const keys = Object.keys(fields);
  const ins = await c.execute({
    sql: `INSERT INTO ${table} (${keys.map(ident).join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
    args: keys.map((k) => fields[k]),
  });
  const id = Number(ins.lastInsertRowid);
  await c.execute({ sql: "INSERT INTO provider_mappings(provider, entity, provider_id, internal_id) VALUES (?,?,?,?)", args: [provider, entity, providerId, id] });
  return id;
}

export async function setOverride(c: Client, o: { entity: Entity; id: number; field: string; value: string | null; reason: string; actor: string }) {
  await c.batch([
    { sql: `INSERT INTO manual_overrides(entity, entity_id, field, value, reason, created_by) VALUES (?,?,?,?,?,?)
            ON CONFLICT(entity, entity_id, field) DO UPDATE SET value=excluded.value, reason=excluded.reason, created_by=excluded.created_by, created_at=datetime('now')`,
      args: [o.entity, o.id, o.field, o.value, o.reason, o.actor] },
    { sql: `UPDATE ${ident(TABLE[o.entity])} SET ${ident(o.field)}=? WHERE id=?`, args: [o.value, o.id] },
    { sql: "INSERT INTO admin_audit(actor, action, target, detail) VALUES (?,?,?,?)", args: [o.actor, "override.set", `${o.entity}:${o.id}`, JSON.stringify({ field: o.field, value: o.value, reason: o.reason })] },
  ], "write");
}

export async function removeOverride(c: Client, o: { entity: Entity; id: number; field: string; actor: string }) {
  await c.batch([
    { sql: "DELETE FROM manual_overrides WHERE entity=? AND entity_id=? AND field=?", args: [o.entity, o.id, o.field] },
    { sql: "INSERT INTO admin_audit(actor, action, target, detail) VALUES (?,?,?,?)", args: [o.actor, "override.remove", `${o.entity}:${o.id}`, JSON.stringify({ field: o.field })] },
  ], "write");
}
