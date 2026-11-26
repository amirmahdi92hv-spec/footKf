import Link from "next/link";
import { requireAdmin } from "@/lib/adminGuard";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { num, ago } from "@/lib/format";
import { footballDataAdapter, FD_FREE_CODES } from "@/lib/providers/footballData";
import { syncCompetition } from "@/lib/sync/engine";
export const dynamic = "force-dynamic";
export const metadata = { title: "مدیریت", robots: { index: false } };

async function runSync(fd: FormData) {
  "use server"; // middleware already guards /admin; actions are re-verified here too
  await requireAdmin();
  const code = String(fd.get("code"));
  if (!FD_FREE_CODES.includes(code)) throw new Error("unknown competition");
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (key) await syncCompetition(footballDataAdapter({ apiKey: key }), code);
  await db().execute({ sql: "INSERT INTO admin_audit(actor, action, target) VALUES ('admin','sync.manual',?)", args: [code] });
  revalidatePath("/admin");
}

export default async function Admin() {
  const c = db();
  const [jobs, usage, audit, counts] = await Promise.all([
    c.execute("SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 15"),
    c.execute("SELECT * FROM api_usage ORDER BY day DESC LIMIT 7"),
    c.execute("SELECT * FROM admin_audit ORDER BY id DESC LIMIT 10"),
    c.execute("SELECT (SELECT COUNT(*) FROM matches) m, (SELECT COUNT(*) FROM teams) t, (SELECT COUNT(*) FROM manual_overrides) o"),
  ]);
  const k = counts.rows[0];
  return (<>
    <h1>پیشخوان مدیریت</h1>
    <p><Link className="btn" href="/admin/content">مدیریت اخبار، انتقال‌ها و اصلاح دستی</Link></p>
    {!process.env.FOOTBALL_DATA_API_KEY && <div className="stale">کلید FOOTBALL_DATA_API_KEY تنظیم نشده؛ همگام‌سازی غیرفعال است.</div>}
    <div className="grid2">
      <div className="panel kpi"><b>{num(Number(k.m))}</b><span>بازی</span></div>
      <div className="panel kpi"><b>{num(Number(k.t))}</b><span>تیم</span></div>
      <div className="panel kpi"><b>{num(Number(k.o))}</b><span>اصلاح دستی فعال</span></div>
    </div>
    <h2>همگام‌سازی دستی</h2>
    <form action={runSync} style={{ display: "flex", gap: 8 }}>
      <select name="code" className="btn" aria-label="رقابت">{FD_FREE_CODES.map((x) => <option key={x}>{x}</option>)}</select>
      <button className="btn primary">اجرا</button>
    </form>
    <h2>مصرف API</h2>
    <div className="panel tbl-wrap"><table><thead><tr><th>منبع</th><th>روز (UTC)</th><th>درخواست</th></tr></thead>
      <tbody>{usage.rows.length ? usage.rows.map((r) => <tr key={`${r.provider}${r.day}`}><td>{String(r.provider)}</td><td>{String(r.day)}</td><td>{num(Number(r.requests))}</td></tr>) : <tr><td colSpan={3}>داده‌ای نیست</td></tr>}</tbody></table></div>
    <h2>آخرین کارها</h2>
    <div className="panel tbl-wrap"><table><thead><tr><th>کار</th><th>وضعیت</th><th>ثبت‌شده</th><th>زمان</th><th>خطا</th></tr></thead>
      <tbody>{jobs.rows.length ? jobs.rows.map((r) => <tr key={String(r.id)}><td>{String(r.job)}</td><td>{String(r.status)}</td><td>{num(Number(r.upserted))}</td><td>{ago(String(r.started_at))}</td><td style={{ whiteSpace: "normal" }}>{String(r.error ?? "")}</td></tr>) : <tr><td colSpan={5}>کاری اجرا نشده</td></tr>}</tbody></table></div>
    <h2>گزارش فعالیت مدیر</h2>
    <div className="panel tbl-wrap"><table><tbody>{audit.rows.length ? audit.rows.map((r) => <tr key={String(r.id)}><td>{String(r.action)}</td><td>{String(r.target ?? "")}</td><td>{ago(String(r.created_at))}</td></tr>) : <tr><td>—</td></tr>}</tbody></table></div>
  </>);
}
