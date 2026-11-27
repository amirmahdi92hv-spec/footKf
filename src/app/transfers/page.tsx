import Link from "next/link";
import { transfersList, squadChanges } from "@/lib/queries";
import { teamFa } from "@/lib/teamNames";
import { ago } from "@/lib/format";
import { Empty } from "@/components/MatchList";
export const dynamic = "force-dynamic";
export const metadata = { title: "نقل‌وانتقالات" };

export default async function Transfers() {
  const [rows, changes] = await Promise.all([transfersList(), squadChanges()]);
  return (<><h1>نقل‌وانتقالات</h1>
    <h2 className="sec" style={{ marginTop: 0 }}>انتقال‌های تأییدشده</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13 }}>فقط انتقال‌های تأییدشده با ذکر منبع؛ شایعه منتشر نمی‌شود.</p>
    {rows.length ? <div className="panel rise">{rows.map((t) => (
      <div className="row" key={String(t.id)}><span><b>{String(t.player_name)}</b><small>{String(t.from_team ?? "؟")} ← {String(t.to_team ?? "؟")}</small></span>
        <span style={{ textAlign: "end" }}>{t.status === "official_announced" ? "اعلام رسمی باشگاه" : "تأییدشده"}<small>{t.source_url ? <a href={String(t.source_url)} rel="noopener noreferrer nofollow">{String(t.source_name)}</a> : String(t.source_name)}{t.transfer_date ? ` · ${t.transfer_date}` : ""}</small></span></div>))}</div>
      : <Empty title="هنوز انتقال تأییدشده‌ای ثبت نشده" hint="انتقال‌های تأییدشده را مدیر با ذکر منبع ثبت می‌کند." />}
    <h2 className="sec">تغییر فهرست تیم‌ها (تشخیص خودکار)</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13 }}>بازیکنانی که در داده‌ی رسمی منبع، در فهرست تیم دیگری دیده شده‌اند. این‌ها انتقال تأییدشده نیستند و ممکن است قرضی یا جابه‌جایی داخلی باشند.</p>
    {changes.length ? <div className="panel rise">{changes.map((c) => (
      <div className="row" key={String(c.id)}><span><Link href={`/players/${c.player_id}`}><b>{String(c.player)}</b></Link>
        <small>{teamFa(String(c.from_name), c.from_fa as string | null)} ← {teamFa(String(c.to_name), c.to_fa as string | null)}</small></span>
        <small>{ago(String(c.detected_at))}</small></div>))}</div>
      : <Empty title="تغییری تشخیص داده نشده" hint="با هر بار به‌روزرسانی فهرست تیم‌ها بررسی می‌شود." />}
  </>);
}
