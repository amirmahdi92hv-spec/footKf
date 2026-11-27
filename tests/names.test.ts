import { describe, it, expect } from "vitest";
import { teamFa } from "@/lib/teamNames";
describe("teamFa", () => {
  it("maps known clubs, distinguishes the two Manchesters, and falls back", () => {
    expect(teamFa("Manchester City FC")).toBe("منچسترسیتی");
    expect(teamFa("Manchester United FC")).toBe("منچستریونایتد");
    expect(teamFa("Paris Saint-Germain FC")).toBe("پاری‌سن‌ژرمن");
    expect(teamFa("Unknown Town FC")).toBe("Unknown Town FC");
  });
  it("manual Persian name wins", () => expect(teamFa("Arsenal FC", "توپچی‌ها")).toBe("توپچی‌ها"));
});
