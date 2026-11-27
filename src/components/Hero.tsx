import Link from "next/link";
import type { MatchRow } from "@/lib/queries";
import { num, dateFa, timeFa, compName } from "@/lib/format";
import { Crest, hn, an } from "./MatchList";
import { Countdown } from "./Countdown";

export function Hero({ m }: { m: MatchRow }) {
  const live = m.status === "live" || m.status === "paused";
  const has = m.home_score !== null && m.away_score !== null;
  return (
    <section className="hero rise" aria-label={live ? "بازی زنده" : "بازی بعدی"}>
      <div className="meta">
        {live ? <span className="pill live livebadge">{m.status === "paused" ? "پایان نیمه" : m.minute ? `زنده · دقیقه ${num(m.minute)}` : "زنده"}</span> : <span className="pill">بازی بعدی</span>}
        <span>{compName(m.comp_code, m.competition)}</span>{m.matchday ? <span>· هفته {num(m.matchday)}</span> : null}
      </div>
      <div className="face">
        <Link href={`/teams/${m.home_id}`} className="tm"><Crest src={m.home_crest} name={m.home} size={64} /><span>{hn(m)}</span></Link>
        <div>
          {live || has ? <div className="big">{num(m.home_score)}<span style={{ opacity: .35 }}> : </span>{num(m.away_score)}</div> : <div className="vs">VS</div>}
          {!live && !has && <><div className="muted" style={{ fontSize: 13 }}>{dateFa(m.kickoff_utc)} · {timeFa(m.kickoff_utc)}</div><Countdown to={m.kickoff_utc} /></>}
        </div>
        <Link href={`/teams/${m.away_id}`} className="tm"><Crest src={m.away_crest} name={m.away} size={64} /><span>{an(m)}</span></Link>
      </div>
      <Link className="cta" href={`/matches/${m.id}`}>{live ? "مشاهدهٔ جزئیات زنده" : "جزئیات بازی"}</Link>
    </section>
  );
}
