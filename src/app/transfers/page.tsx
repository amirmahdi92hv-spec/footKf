import { transfersList } from "@/lib/queries";
import { Empty } from "@/components/MatchList";
export const dynamic = "force-dynamic";
export const metadata = { title: "نقل‌وانتقالات" };

export default async function Transfers() {
  const rows = await transfersList();
  return (<><h1>نقل‌وانتقالات تأییدشده</h1>
    <p style={{ color: "var(--muted)" }}>فقط انتقال‌های تأییدشده با ذکر منبع نمایش داده می‌شوند؛ شایعه منتشر نمی‌شود.</p>
    {rows.length ? <div className="panel">{rows.map((t) => (
      <div className="row" key={String(t.id)}><span><b>{String(t.player_name)}</b><small>{String(t.from_team ?? "؟")} ← {String(t.to_team ?? "؟")}</small></span>
        <span style={{ textAlign: "end" }}>{t.status === "official_announced" ? "اعلام رسمی باشگاه" : "تأییدشده"}<small>{t.source_url ? <a href={String(t.source_url)} rel="noopener noreferrer nofollow">{String(t.source_name)}</a> : String(t.source_name)}{t.transfer_date ? ` · ${t.transfer_date}` : ""}</small></span></div>))}</div>
      : <Empty title="هنوز انتقالی ثبت نشده" hint="انتقال‌ها به‌صورت دستی و با منبع توسط مدیر ثبت می‌شوند." />}</>);
}
