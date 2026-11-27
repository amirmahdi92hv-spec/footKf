// LOCAL UI DEVELOPMENT ONLY. Fictional clubs, clearly labeled demo. Refuses to run against remote databases.
import { db } from "../src/db/client";
import { migrate } from "../src/db/migrate";
const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("file:")) { console.error("seed-demo only runs on a local file: database"); process.exit(1); }
const c = db();
await migrate(c);
for (const t of ["match_events","scorers","standings","matches","players","teams","seasons","competitions","news","transfers","data_freshness"]) await c.execute(`DELETE FROM ${t}`);
await c.execute("INSERT INTO competitions(id, code, name, country, type) VALUES (1,'DEMO','Demo League (fictional)','Demoland','LEAGUE')");
await c.execute("INSERT INTO seasons(id, competition_id, start_date, is_current, current_matchday) VALUES (1,1,'2026-08-01',1,14)");
const names = ["Aurora United","Blue Harbor","Crimson Rovers","Delta City","Eastbridge Athletic","Falcon Park","Granite Town","Highland Wanderers","Iron Vale","Jade Coast"];
const tla = ["AUR","BLH","CRR","DEC","EAB","FAP","GRT","HIW","IRV","JDC"];
const crest = (n: string, h: number) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path d='M6 4h36v22c0 10-8 16-18 20C14 42 6 36 6 26z' fill='hsl(${h} 60% 42%)'/><text x='24' y='29' font-size='15' font-family='sans-serif' font-weight='700' fill='white' text-anchor='middle'>${n[0]}</text></svg>`);
for (let i = 0; i < 10; i++) await c.execute({ sql: "INSERT INTO teams(id,name,tla,crest_url,venue,coach_name,founded) VALUES (?,?,?,?,?,?,?)", args: [i + 1, names[i], tla[i], i < 6 ? crest(names[i], i * 55) : null, `${names[i]} Stadium`, "Coach " + (i + 1), 1890 + i * 7] });
const pos = ["Goalkeeper", "Defence", "Midfield", "Offence"];
let pid = 1;
for (let t = 1; t <= 10; t++) for (let k = 0; k < 11; k++) await c.execute({ sql: "INSERT INTO players(id,name,position,nationality,birth_date,team_id) VALUES (?,?,?,?,?,?)", args: [pid++, `Player ${t}-${k + 1}`, pos[k === 0 ? 0 : k < 5 ? 1 : k < 8 ? 2 : 3], ["England","Spain","Brazil","Iran","France"][k % 5], `${1992 + (k % 9)}-0${1 + (k % 9)}-1${k % 9}`, t] });
const day = 864e5, now = Date.now(); let mid = 1; const fin: [number, number, number, number][] = [];
const add = (h: number, a: number, off: number, st: string, hs: number | null, as: number | null) => {
  const when = new Date(now + off).toISOString();
  c.execute({ sql: "INSERT INTO matches(id,season_id,competition_id,home_team_id,away_team_id,kickoff_utc,status,matchday,home_score,away_score,minute) VALUES (?,?,?,?,?,?,?,?,?,?,?)", args: [mid++, 1, 1, h, a, when, st, 14, hs, as, st === "live" ? 63 : null] });
  if (st === "finished") fin.push([h, a, hs!, as!]);
};
const pairs = [[1,2],[3,4],[5,6],[7,8],[9,10],[2,3],[4,5],[6,7],[8,9],[10,1]];
pairs.forEach(([h, a], i) => add(h, a, -(10 - i) * day * 0.7, "finished", (i * 2 + 1) % 4, (i + 2) % 3));
add(1, 3, -36e5 * 1.1, "live", 2, 1); add(6, 9, -36e5 * 1.0, "live", 0, 0);
add(2, 5, 3 * 36e5, "scheduled", null, null); add(4, 7, 5 * 36e5, "scheduled", null, null); add(8, 10, 8 * 36e5, "scheduled", null, null);
pairs.forEach(([h, a], i) => add(a, h, (i + 1) * day * 0.6 + 36e5, "scheduled", null, null));
await Promise.all([]);
const rows = (await c.execute("SELECT id, home_team_id h, away_team_id a, home_score hs, away_score a_s, status FROM matches")).rows;
const st: Record<number, number[]> = {}; for (let t = 1; t <= 10; t++) st[t] = [0, 0, 0, 0, 0, 0, 0];
for (const m of rows) if (m.status === "finished") { const h = st[Number(m.h)], a = st[Number(m.a)], hs = Number(m.hs), as = Number(m.a_s);
  h[0]++; a[0]++; h[4] += hs; h[5] += as; a[4] += as; a[5] += hs; if (hs > as) { h[1]++; a[3]++; h[6] += 3; } else if (hs < as) { a[1]++; h[3]++; a[6] += 3; } else { h[2]++; a[2]++; h[6]++; a[6]++; } }
Object.entries(st).sort((x, y) => y[1][6] - x[1][6] || (y[1][4] - y[1][5]) - (x[1][4] - x[1][5])).forEach(([t, s], i) =>
  c.execute({ sql: "INSERT INTO standings(season_id,team_id,position,played,won,draw,lost,goals_for,goals_against,points) VALUES (1,?,?,?,?,?,?,?,?,?)", args: [Number(t), i + 1, s[0], s[1], s[2], s[3], s[4], s[5], s[6]] }));
const ev = (m: number, min: number, kind: string, team: number, p: string, r: string | null = null) => c.execute({ sql: "INSERT INTO match_events(match_id,minute,kind,team_id,player_name,related_player_name,provider_key) VALUES (?,?,?,?,?,?,?)", args: [m, min, kind, team, p, r, `${kind}-${min}-${p}`] });
ev(11, 12, "goal", 1, "Player 1-11", "Player 1-9"); ev(11, 31, "yellow", 3, "Player 3-4"); ev(11, 38, "goal", 3, "Player 3-10"); ev(11, 55, "sub", 1, "Player 1-12", "Player 1-8"); ev(11, 58, "penalty", 1, "Player 1-10");
ev(1, 22, "goal", 1, "Player 1-10"); ev(1, 67, "red", 2, "Player 2-3");
for (const [p, t, g] of [[11, 1, 7],[22, 2, 6],[33, 3, 5],[44, 4, 4],[55, 5, 4],[66, 6, 3]]) await c.execute({ sql: "INSERT INTO scorers(season_id,player_id,team_id,goals,assists,penalties,played) VALUES (1,?,?,?,?,?,?)", args: [p, t, g, g - 3 > 0 ? g - 3 : 1, 1, 12] });
await c.execute({ sql: "INSERT INTO data_freshness(scope,last_ok_at) VALUES ('competition:1',?)", args: [new Date().toISOString()] });
for (let i = 1; i <= 5; i++) await c.execute({ sql: "INSERT INTO news(title,summary,source_name,source_url,published_at) VALUES (?,?,?,?,?)", args: [`خبر نمایشی شمارهٔ ${i}`, "این یک خبر آزمایشی برای بررسی ظاهر است و واقعی نیست.", "داده نمایشی", `https://example.com/demo-${i}`, new Date(now - i * 36e5 * 3).toISOString()] });
await c.execute({ sql: "INSERT INTO transfers(player_name,from_team,to_team,transfer_date,status,source_name) VALUES ('Player 2-5','Blue Harbor','Aurora United','2026-11-20','confirmed','داده نمایشی')" });
console.log("demo seeded");
