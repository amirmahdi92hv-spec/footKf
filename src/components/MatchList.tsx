import Link from "next/link";
import type { MatchRow } from "@/lib/queries";
import { num, timeFa, STATUS_FA } from "@/lib/format";

export const Crest = ({ src, name }: { src: string | null; name: string }) =>
  src ? <img className="crest" src={src} alt="" width={24} height={24} loading="lazy" /> : <span className="crest" aria-hidden>{name.slice(0, 1)}</span>;

export function MatchList({ rows }: { rows: MatchRow[] }) {
  const groups = new Map<string, MatchRow[]>();
  rows.forEach((m) => groups.set(m.competition, [...(groups.get(m.competition) ?? []), m]));
  return (
    <div className="panel">
      {[...groups].map(([comp, ms]) => (
        <section key={comp} aria-label={comp}>
          <div className="group-h">{comp}</div>
          {ms.map((m) => {
            const live = m.status === "live" || m.status === "paused";
            const hasScore = m.home_score !== null && m.away_score !== null;
            return (
              <Link className="mc" key={m.id} href={`/matches/${m.id}`}>
                <div className="time">{live ? <span className="pill live">{STATUS_FA[m.status]}</span> : m.status === "scheduled" ? timeFa(m.kickoff_utc) : <span className="pill">{STATUS_FA[m.status]}</span>}</div>
                <div className="t home"><Crest src={m.home_crest} name={m.home} /><span>{m.home}</span></div>
                <div className="score" aria-label={hasScore ? `${m.home} ${num(m.home_score)} ${m.away} ${num(m.away_score)}` : "نتیجه‌ای ثبت نشده"}>
                  {hasScore ? `${num(m.home_score)} - ${num(m.away_score)}` : "–"}
                </div>
                <div className="t away"><Crest src={m.away_crest} name={m.away} /><span>{m.away}</span></div>
              </Link>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export const Empty = ({ title, hint }: { title: string; hint?: string }) => <div className="state panel"><b>{title}</b>{hint}</div>;
