import Link from "next/link";
import { competitions } from "@/lib/queries";
import { compName } from "@/lib/format";
import { Crest, Empty } from "@/components/MatchList";
export const dynamic = "force-dynamic";
export const metadata = { title: "لیگ‌ها" };

export default async function Competitions() {
  const rows = await competitions();
  return (<><h1>لیگ‌ها و رقابت‌ها</h1>
    {rows.length ? <div className="grid2">{rows.map((c, i) => (
      <Link key={String(c.id)} href={`/competitions/${c.code}`} className="panel pad card-link rise" style={{ display: "flex", alignItems: "center", gap: 14, ["--i" as string]: i }}>
        <Crest src={c.emblem_url as string | null} name={String(c.name)} size={44} />
        <span><b style={{ fontSize: 16 }}>{compName(String(c.code), String(c.name))}</b><small className="muted" style={{ display: "block" }}>{String(c.country ?? "")}</small></span></Link>))}</div>
    : <Empty title="هنوز رقابتی همگام‌سازی نشده" />}</>);
}
