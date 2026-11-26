import { createClient, type Client } from "@libsql/client";

let client: Client | undefined;
export function db(): Client {
  client ??= createClient({
    url: process.env.DATABASE_URL ?? "file:./footkf.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
  return client;
}
export function setDbForTests(c: Client) { client = c; }
