import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./helpers";
import { addNews, addTransfer, applyOverride, importNewsJson } from "@/lib/adminActions";

let c: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { c = await freshDb(); });
const n = async (t: string) => Number((await c.execute(`SELECT COUNT(*) n FROM ${t}`)).rows[0].n);

describe("admin content", () => {
  it("rejects non-https news links and dedupes by url", async () => {
    await expect(addNews({ title: "abc", source_name: "BBC", source_url: "http://x.com/a" }, "a")).rejects.toThrow();
    const ok = { title: "abc", source_name: "BBC", source_url: "https://x.com/a" };
    await addNews(ok, "a"); await addNews(ok, "a");
    expect(await n("news")).toBe(1);
  });
  it("JSON import counts good and bad rows", async () => {
    const r = await importNewsJson(JSON.stringify([{ title: "abc", source_name: "BBC", source_url: "https://x.com/1" }, { title: "x" }]), "a");
    expect(r).toEqual({ ok: 1, bad: 1 });
  });
  it("transfers require a source and a non-rumor status", async () => {
    await expect(addTransfer({ player_name: "Ali", status: "rumor", source_name: "X" }, "a")).rejects.toThrow();
    await expect(addTransfer({ player_name: "Ali", status: "confirmed" }, "a")).rejects.toThrow();
    await addTransfer({ player_name: "Ali", status: "confirmed", source_name: "Club site" }, "a");
    expect(await n("transfers")).toBe(1);
  });
  it("override validates field, value and entity existence", async () => {
    await expect(applyOverride({ kind: "match", id: 1, field: "home_score", value: "2", reason: "" }, "a")).rejects.toThrow("not found");
    await expect(applyOverride({ kind: "match", id: 1, field: "id", value: "2", reason: "" }, "a")).rejects.toThrow("not allowed");
    await expect(applyOverride({ kind: "match", id: 1, field: "home_score", value: "abc", reason: "" }, "a")).rejects.toThrow();
  });
});
