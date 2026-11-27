import Link from "next/link";
import { matchesOn, competitionsWithMatchesOn } from "@/lib/queries";
import { todayYmd, dateFa, compName } from "@/lib/format";
import { MatchList, Empty } from "@/components/MatchList";
import { DateStrip } from "@/components/DateStrip";
import { AutoRefresh } from "@/components/AutoRefresh";
export const dynamic = "force-dynamic";
export const metadata = { title: "بازی‌ها" };

export default async function Matches({ searchParams }: { searchParams: Promise<{ d?: string; c?: string }> }) {
  const { d, c } = await searchParams;
  const ymd = d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)) ? d : todayYmd();
  const comps = await competitionsWithMatchesOn(ymd);
  const sel = comps.find((x) => String(x.code) === c);
  const all = await matchesOn(ymd, sel ? Number(sel.id) : undefined);
  const hasLive = all.some((m) => m.status === "live" || m.status === "paused");
  return (<>
    {hasLive && <AutoRefresh seconds={30} />}
    <h1>بازی‌ها</h1>
    <DateStrip selected={ymd} extra={sel ? `&c=${sel.code}` : ""} />
    <p className="muted" style={{ margin: "0 0 12px", fontWeight: 600 }}>{dateFa(`${ymd}T12:00:00Z`)}</p>
    {comps.length > 1 && <div className="chips" role="group" aria-label="فیلتر لیگ">
      <Link className="chip" href={`/matches?d=${ymd}`} aria-current={!sel ? "true" : undefined} scroll={false}>همه</Link>
      {comps.map((x) => <Link key={String(x.id)} className="chip" href={`/matches?d=${ymd}&c=${x.code}`} aria-current={sel && sel.id === x.id ? "true" : undefined} scroll={false}>{compName(String(x.code), String(x.name))}</Link>)}
    </div>}
    {all.length ? <MatchList rows={all} /> : <Empty title="بازی‌ای برای این روز نیست" hint="یا این روز در پوشش منبع داده نیست؛ روز دیگری را انتخاب کنید." />}
  </>);
}
