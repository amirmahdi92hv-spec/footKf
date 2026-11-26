import { createClient } from "@libsql/client";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setDbForTests } from "@/db/client";
import { migrate } from "@/db/migrate";

export async function freshDb() {
  const c = createClient({ url: `file:${join(mkdtempSync(join(tmpdir(), "fk-")), "t.db")}` });
  await migrate(c);
  setDbForTests(c);
  return c;
}
