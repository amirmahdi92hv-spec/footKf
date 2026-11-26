import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySession, passwordOk } from "@/lib/auth";

beforeAll(() => { process.env.SESSION_SECRET = "x".repeat(40); process.env.ADMIN_PASSWORD = "correct-horse-battery"; });
describe("admin auth", () => {
  it("accepts a fresh signed session and rejects tampering/expiry/garbage", async () => {
    const s = await signSession();
    expect(await verifySession(s)).toBe(true);
    expect(await verifySession(s.replace(/.$/, (c) => (c === "0" ? "1" : "0")))).toBe(false);
    expect(await verifySession(`1.${"a".repeat(64)}`)).toBe(false);
    expect(await verifySession(undefined)).toBe(false);
    expect(await verifySession("nonsense")).toBe(false);
  });
  it("checks the password and refuses weak/unset config", async () => {
    expect(await passwordOk("correct-horse-battery")).toBe(true);
    expect(await passwordOk("wrong")).toBe(false);
    process.env.ADMIN_PASSWORD = "short";
    expect(await passwordOk("short")).toBe(false);
  });
});
