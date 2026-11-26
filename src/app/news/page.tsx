import { newsList } from "@/lib/queries";
import { Empty } from "@/components/MatchList";
import { ago } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "اخبار" };

export default async function News() {
  const rows = await newsList();
  return (<><h1>اخبار فوتبال</h1>
    {rows.length ? <div className="panel">{rows.map((n) => (
      <a className="row" key={String(n.id)} href={String(n.source_url)} target="_blank" rel="noopener noreferrer nofollow">
        <span><b>{String(n.title)}</b>{n.summary ? <small>{String(n.summary)}</small> : null}</span>
        <small style={{ textAlign: "end", whiteSpace: "nowrap" }}>{String(n.source_name)}<br />{ago(String(n.published_at))}</small></a>))}</div>
      : <Empty title="خبری ثبت نشده" hint="اخبار با خلاصهٔ کوتاه و پیوند به منبع اصلی منتشر می‌شوند." />}</>);
}
