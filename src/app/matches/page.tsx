import Link from "next/link";
import { matchesOn } from "@/lib/queries";
import { todayYmd, shiftYmd, dateFa } from "@/lib/format";
import { MatchList, Empty } from "@/components/MatchList";
export const dynamic = "force-dynamic";
export const metadata = { title: "بازی‌ها" };

export default async function Matches({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const ymd = d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)) ? d : todayYmd();
  const rows = await matchesOn(ymd);
  return (<>
    <h1>بازی‌ها</h1>
    <div className="datenav">
      <Link className="btn" href={`/matches?d=${shiftYmd(ymd, -1)}`} rel="prev">روز قبل</Link>
      <strong style={{ flex: 1, textAlign: "center" }}>{dateFa(`${ymd}T12:00:00Z`)}</strong>
      <Link className="btn" href={`/matches?d=${shiftYmd(ymd, 1)}`} rel="next">روز بعد</Link>
    </div>
    {rows.length ? <MatchList rows={rows} /> : <Empty title="بازی‌ای برای این روز نیست" hint="یا این روز در پوشش منبع داده نیست." />}
  </>);
}
