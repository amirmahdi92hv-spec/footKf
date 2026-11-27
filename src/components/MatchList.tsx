import Link from "next/link";
import type { MatchRow } from "@/lib/queries";
import { num, timeFa, STATUS_FA, compName } from "@/lib/format";
import { teamFa } from "@/lib/teamNames";
import { Crest } from "./Crest";
import { IEmpty } from "./Icons";

export { Crest };
export const hn = (m: MatchRow) => teamFa(m.home, m.home_fa);
export const an = (m: MatchRow) => teamFa(m.away, m.away_fa);

export function MatchList({ rows, showDate }: { rows: MatchRow[]; showDate?: boolean }) {
  const groups = new Map<string, { code: string | null; ms: MatchRow[] }>();
  rows.forEach((m) => { const g = groups.get(m.competition) ?? { code: m.comp_code, ms: [] }; g.ms.push(m); groups.set(m.competition, g); });
  let i = 0;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {[...groups].map(([comp, g]) => (
        <section key={comp} className="panel rise" style={{ ["--i" as string]: i++ }} aria-label={comp}>
          <div className="grp-h"><span className="dot" />{compName(g.code, comp)}{g.code && <Link href={`/competitions/${g.code}`}>جدول و آمار ←</Link>}</div>
          {g.ms.map((m) => {
            const live = m.status === "live" || m.status === "paused";
            const has = m.home_score !== null && m.away_score !== null;
            return (
              <Link className={`mc ${live ? "is-live" : ""}`} key={m.id} href={`/matches/${m.id}`}>
                <div className="time">
                  {live ? <span className="pill live">{m.minute ? `${num(m.minute)}'` : STATUS_FA[m.status]}</span>
                    : m.status === "scheduled" ? <b>{timeFa(m.kickoff_utc)}</b> : <span className="pill">{STATUS_FA[m.status]}</span>}
                </div>
                <div className="t home"><Crest src={m.home_crest} name={m.home} /><span className="nm">{hn(m)}</span></div>
                <div className={`score ${live ? "live" : ""}`} aria-label={has ? `${hn(m)} ${num(m.home_score)}، ${an(m)} ${num(m.away_score)}` : "نتیجه‌ای ثبت نشده"}>
                  {has ? <>{num(m.home_score)}<span style={{ opacity: .4 }}>:</span>{num(m.away_score)}</> : <span style={{ opacity: .4 }}>—</span>}
                </div>
                <div className="t away"><Crest src={m.away_crest} name={m.away} /><span className="nm">{an(m)}</span></div>
              </Link>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export const Empty = ({ title, hint }: { title: string; hint?: string }) => <div className="state panel"><IEmpty /><b>{title}</b>{hint}</div>;
