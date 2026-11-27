import Link from "next/link";
import { liveMatches, matchesOn, latestSync, nextMatch, featuredCompetition, standingsWithTeams, newsList, topScorers } from "@/lib/queries";
import { todayYmd } from "@/lib/format";
import { MatchList, Empty } from "@/components/MatchList";
import { Hero } from "@/components/Hero";
import { Standings } from "@/components/Standings";
import { Freshness } from "@/components/Freshness";
import { FavTeams } from "@/components/Fav";
import { AdSlot } from "@/components/AdSlot";
import { AutoRefresh } from "@/components/AutoRefresh";
import { compName, ago, num } from "@/lib/format";
export const dynamic = "force-dynamic";

export default async function Home() {
  const [live, today, last, next, comp, news] = await Promise.all([liveMatches(), matchesOn(todayYmd()), latestSync(), nextMatch(), featuredCompetition(), newsList()]);
  const [table, scorers] = comp ? await Promise.all([standingsWithTeams(Number(comp.id)), topScorers(Number(comp.id))]) : [[], []];
  const hero = live[0] ?? next;
  const todayRest = today.filter((m) => !live.some((l) => l.id === m.id));
  return (<>
    {live.length > 0 && <AutoRefresh seconds={30} />}
    <Freshness lastOk={last} />
    <div className="cols">
      <div>
        {hero ? <Hero m={hero} /> : <Empty title="بازی‌ای برای نمایش نیست" hint="بعد از همگام‌سازی داده، بازی‌ها اینجا نمایش داده می‌شوند." />}
        {live.length > 1 && <><h2 className="sec">بازی‌های زنده <span className="pill live">{num(live.length)}</span></h2><MatchList rows={live} /></>}
        <h2 className="sec">بازی‌های امروز<Link href="/matches">همهٔ بازی‌ها ←</Link></h2>
        {todayRest.length ? <MatchList rows={todayRest} /> : <Empty title="امروز بازی دیگری نیست" hint="از بخش «بازی‌ها» روزهای دیگر را ببینید." />}
        <div style={{ marginTop: 16 }}><FavTeams /></div>
      </div>
      <aside className="side">
        {comp && table.length > 0 && <section><h2 className="sec" style={{ marginTop: 0 }}>{compName(String(comp.code), String(comp.name))}<Link href={`/competitions/${comp.code}`}>جدول کامل ←</Link></h2><Standings rows={table} code={String(comp.code)} compact /></section>}
        {scorers.length > 0 && <section><h2 className="sec">گلزنان برتر</h2><div className="panel">{scorers.slice(0, 5).map((x, i) => (
          <Link key={String(x.id)} href={`/players/${x.id}`} className="row"><span style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="rank">{num(i + 1)}</span><span>{String(x.name)}<small>{String(x.team ?? "")}</small></span></span><span className="num-badge">{num(Number(x.goals))}</span></Link>))}</div></section>}
        <AdSlot slot="sidebar" />
        {news.length > 0 && <section><h2 className="sec">آخرین اخبار<Link href="/news">همه ←</Link></h2><div className="panel">{news.slice(0, 4).map((n) => (
          <a key={String(n.id)} className="row" href={String(n.source_url)} target="_blank" rel="noopener noreferrer nofollow"><span>{String(n.title)}<small>{String(n.source_name)} · {ago(String(n.published_at))}</small></span></a>))}</div></section>}
      </aside>
    </div>
  </>);
}
