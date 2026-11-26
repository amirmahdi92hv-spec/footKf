import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Client } from "@libsql/client";

export async function migrate(c: Client, dir = join(process.cwd(), "src/db/migrations")) {
  await c.execute("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
  const done = new Set((await c.execute("SELECT name FROM _migrations")).rows.map((r) => String(r.name)));
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    await c.executeMultiple(readFileSync(join(dir, f), "utf8"));
    await c.execute({ sql: "INSERT INTO _migrations(name) VALUES (?)", args: [f] });
  }
}
