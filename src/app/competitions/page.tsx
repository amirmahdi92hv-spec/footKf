import Link from "next/link";
import { competitions } from "@/lib/queries";
import { compName } from "@/lib/format";
import { Empty } from "@/components/MatchList";
export const dynamic = "force-dynamic";
export const metadata = { title: "لیگ‌ها" };

export default async function Competitions() {
  const rows = await competitions();
  return (<><h1>لیگ‌ها و رقابت‌ها</h1>
    {rows.length ? <div className="grid2">{rows.map((c) => (
      <Link key={String(c.id)} href={`/competitions/${c.code}`} className="panel kpi"><b>{compName(String(c.code), String(c.name))}</b><span>{String(c.country ?? "")}</span></Link>))}</div>
    : <Empty title="هنوز رقابتی همگام‌سازی نشده" />}</>);
}
