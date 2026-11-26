import { createRequire } from "node:module";
import { createClient as createWebClient, type Client } from "@libsql/client/web";

let client: Client | undefined;

/**
 * Remote URLs (libsql:// or https://) use the pure-fetch web client, which needs no native module
 * (works on Termux/Android). Local `file:` URLs lazily load the native client (dev/tests only).
 */
export function db(): Client {
  if (client) return client;
  const url = process.env.DATABASE_URL ?? "file:./footkf.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
  if (url.startsWith("file:")) {
    const req = createRequire(import.meta.url);
    client = (req("@libsql/client") as typeof import("@libsql/client")).createClient({ url, authToken });
  } else {
    client = createWebClient({ url, authToken });
  }
  return client;
}
export function setDbForTests(c: Client) { client = c; }
