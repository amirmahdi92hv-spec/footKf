import { footballDataAdapter } from "../src/lib/providers/footballData";
import { syncCompetition } from "../src/lib/sync/engine";
const key = process.env.FOOTBALL_DATA_API_KEY;
if (!key) { console.error("FOOTBALL_DATA_API_KEY not set"); process.exit(1); }
const p = footballDataAdapter({ apiKey: key });
for (const code of (process.argv[2] ?? "PL").split(",")) console.log(code, await syncCompetition(p, code));
