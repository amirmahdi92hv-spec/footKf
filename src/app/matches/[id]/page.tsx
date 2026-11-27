import { notFound } from "next/navigation";
import Link from "next/link";
import { matchById, eventsFor, formOf, headToHead } from "@/lib/queries";
import { num, dateFa, timeFa, STATUS_FA, compName } from "@/lib/format";
import { teamFa } from "@/lib/teamNames";
import { Crest, Empty, hn, an, MatchList } from "@/components/MatchList";
import { FormPills } from "@/components/FormPills";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Countdown } from "@/components/Countdown";
import { IGoal, ICard, ISub } from "@/components/Icons";
export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = { goal: "گل", own_goal: "گل به خودی", penalty: "گل پنالتی", yellow: "کارت زرد", red: "کارت قرمز", sub: "تعویض" };
const icon = (k: string) => k === "yellow" ? <ICard /> : k === "red" ? <ICard red /> : k === "sub" ? <ISub /> : <IGoal />;

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const m = Number.isInteger(id) ? await matchById(id) : undefined;
  if (!m) notFound();
  const [ev, fh, fa, h2h] = await Promise.all([eventsFor(id), formOf(m.home_id), formOf(m.away_id), headToHead(m.home_id, m.away_id)]);
  const live = m.status === "live" || m.status === "paused";
  const has = m.home_score !== null && m.away_score !== null;
  return (<>
    {live && <AutoRefresh seconds={20} />}
    <section className="hero rise">
      <div className="meta">
        {live ? <span className="pill live livebadge">{m.minute ? `زنده · دقیقه ${num(m.minute)}` : "زنده"}</span> : <span className="pill">{STATUS_FA[m.status]}</span>}
        <Link href={`/competitions/${m.comp_code}`}>{compName(m.comp_code, m.competition)}</Link>{m.matchday ? <span>· هفته {num(m.matchday)}</span> : null}
      </div>
      <div className="face">
        <Link href={`/teams/${m.home_id}`} className="tm"><Crest src={m.home_crest} name={m.home} size={72} /><span>{hn(m)}</span><FormPills form={fh} /></Link>
        <div>
          {has ? <div className="big">{num(m.home_score)}<span style={{ opacity: .35 }}> : </span>{num(m.away_score)}</div> : <div className="vs">VS</div>}
          <div className="muted" style={{ fontSize: 13 }}>{dateFa(m.kickoff_utc)} · {timeFa(m.kickoff_utc)}</div>
          {m.status === "scheduled" && <Countdown to={m.kickoff_utc} />}
        </div>
        <Link href={`/teams/${m.away_id}`} className="tm"><Crest src={m.away_crest} name={m.away} size={72} /><span>{an(m)}</span><FormPills form={fa} /></Link>
      </div>
    </section>
    <div className="cols">
      <div>
        <h2 className="sec" style={{ marginTop: 8 }}>رویدادهای بازی</h2>
        {ev.length ? <div className="panel tl rise">{ev.map((e) => {
          const home = Number(e.team_id) === m.home_id;
          return (<div className="ev" key={String(e.id)}>
            <div className={`what ${home ? "home-side" : "away-side"}`} style={home ? undefined : { gridColumn: 3 }}>{icon(String(e.kind))}<span>{String(e.player_name ?? "نامشخص")}<small>{LABEL[String(e.kind)]}{e.related_player_name ? ` · ${e.kind === "sub" ? "خروج" : "پاس گل"}: ${e.related_player_name}` : ""}</small></span></div>
            <span className="min" style={{ gridColumn: 2, gridRow: 1 }}>{e.minute == null ? "—" : `${num(Number(e.minute))}'`}</span>
          </div>);
        })}</div> : <Empty title="رویدادی در دسترس نیست" hint={m.status === "scheduled" ? "رویدادها بعد از شروع بازی نمایش داده می‌شوند." : "منبع داده برای این بازی رویداد ارائه نکرده یا هنوز دریافت نشده است."} />}
      </div>
      <aside className="side">
        <section><h2 className="sec" style={{ marginTop: 8 }}>اطلاعات بازی</h2>
          <div className="panel facts">
            <div><small>رقابت</small><b>{compName(m.comp_code, m.competition)}</b></div>
            <div><small>وضعیت</small><b>{STATUS_FA[m.status]}</b></div>
            <div><small>زمان</small><b>{timeFa(m.kickoff_utc)}</b></div>
            {m.venue ? <div><small>ورزشگاه میزبان</small><b>{m.venue}</b></div> : null}
          </div></section>
        {h2h.length > 0 && <section><h2 className="sec">دیدارهای قبلی (در داده‌های موجود)</h2><MatchList rows={h2h} /></section>}
      </aside>
    </div>
  </>);
}
