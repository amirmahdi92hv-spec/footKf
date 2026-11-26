import { liveMatches, matchesOn, latestSync } from "@/lib/queries";
import { todayYmd } from "@/lib/format";
import { MatchList, Empty } from "@/components/MatchList";
import { Freshness } from "@/components/Freshness";
export const dynamic = "force-dynamic";

export default async function Home() {
  const [live, today, last] = await Promise.all([liveMatches(), matchesOn(todayYmd()), latestSync()]);
  return (<>
    <Freshness lastOk={last} />
    <h1>بازی‌های زنده</h1>
    {live.length ? <MatchList rows={live} /> : <Empty title="الان بازی زنده‌ای نیست" hint="بازی‌های امروز را در ادامه ببینید." />}
    <h2>بازی‌های امروز</h2>
    {today.length ? <MatchList rows={today} /> : <Empty title="امروز بازی‌ای ثبت نشده" hint="اگر همگام‌سازی داده انجام نشده باشد، این بخش خالی می‌ماند." />}
  </>);
}
