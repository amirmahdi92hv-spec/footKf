import { footballDataAdapter } from "../src/lib/providers/footballData";
import { syncCompetition } from "../src/lib/sync/engine";

// Usage: npm run sync PL        -> window of last 7 days to next 14 days (fast)
//        npm run sync PL full   -> entire season (slow on remote databases)
const key = process.env.FOOTBALL_DATA_API_KEY;
console.log("key set:", Boolean(key), "| db:", process.env.DATABASE_URL);
if (!key) { console.error("FOOTBALL_DATA_API_KEY not set"); process.exit(1); }
const day = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);
const range = process.argv[3] === "full" ? undefined : { dateFrom: day(-7), dateTo: day(14) };
const p = footballDataAdapter({ apiKey: key });
const t0 = Date.now();
try {
  for (const code of (process.argv[2] ?? "PL").split(",")) {
    console.log("syncing", code, range ? `(${range.dateFrom} .. ${range.dateTo})` : "(full season)", "...");
    console.log(code, JSON.stringify(await syncCompetition(p, code, range)), `${Math.round((Date.now() - t0) / 1000)}s`);
  }
} catch (e) {
  console.error("CRASH:", e);
}
process.exit(0);
