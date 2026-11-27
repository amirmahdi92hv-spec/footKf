import Link from "next/link";
import { num } from "@/lib/format";
import { teamFa } from "@/lib/teamNames";
import { Crest } from "./Crest";
import { FormPills } from "./FormPills";

// Approximate qualification/relegation zones by competition code (rules vary by season; shown as indicative).
const ZONES: Record<string, { cl?: [number, number]; el?: [number, number]; rel?: [number, number] }> = {
  PL: { cl: [1, 4], el: [5, 5], rel: [18, 20] }, PD: { cl: [1, 4], el: [5, 6], rel: [18, 20] }, SA: { cl: [1, 4], el: [5, 6], rel: [18, 20] },
  BL1: { cl: [1, 4], el: [5, 6], rel: [16, 18] }, FL1: { cl: [1, 3], el: [4, 5], rel: [16, 18] },
};
const zone = (code: string | null, pos: number, total: number) => {
  const z = code ? ZONES[code] : undefined; if (!z || total < 16) return "";
  const inR = (r?: [number, number]) => r && pos >= r[0] && pos <= r[1];
  return inR(z.cl) ? "z-cl" : inR(z.el) ? "z-el" : inR(z.rel) ? "z-rel" : "";
};

type Row = Record<string, unknown>;
export function Standings({ rows, code, compact, forms }: { rows: Row[]; code: string | null; compact?: boolean; forms?: Record<number, ("W" | "D" | "L")[]> }) {
  const list = compact ? rows.slice(0, 6) : rows;
  const showZones = !compact && code && ZONES[code] && rows.length >= 16;
  return (
    <div className="panel rise">
      <div className="tbl-wrap"><table>
        <caption className="sr">جدول رده‌بندی</caption>
        <thead><tr><th>#</th><th style={{ textAlign: "start" }}>تیم</th><th>بازی</th>{!compact && <><th className="hide-sm">برد</th><th className="hide-sm">مس</th><th className="hide-sm">باخت</th></>}
          <th className="hide-sm">+/-</th>{!compact && forms && <th className="hide-sm">فرم</th>}<th>امتیاز</th></tr></thead>
        <tbody>{list.map((r) => {
          const diff = Number(r.goals_for) - Number(r.goals_against);
          return (<tr key={String(r.team_id)} className={compact ? "" : zone(code, Number(r.position), rows.length)}>
            <td className="pos">{num(Number(r.position))}</td>
            <td className="team"><Link href={`/teams/${r.team_id}`}><Crest src={r.crest_url as string | null} name={String(r.name)} size={22} />{teamFa(String(r.name), r.name_fa as string | null)}</Link></td>
            <td>{num(Number(r.played))}</td>
            {!compact && <><td className="hide-sm">{num(Number(r.won))}</td><td className="hide-sm">{num(Number(r.draw))}</td><td className="hide-sm">{num(Number(r.lost))}</td></>}
            <td className="hide-sm" dir="ltr">{diff > 0 ? "+" : ""}{num(diff)}</td>
            {!compact && forms && <td className="hide-sm"><FormPills form={forms[Number(r.team_id)] ?? []} /></td>}
            <td className="pts">{num(Number(r.points))}</td></tr>);
        })}</tbody>
      </table></div>
      {showZones && <div className="legend"><span><i style={{ background: "#3b82f6" }} />قهرمانان اروپا</span><span><i style={{ background: "#f59e0b" }} />اروپا لیگ / کنفرانس</span><span><i style={{ background: "var(--live)" }} />سقوط</span><span>(رنگ‌بندی تقریبی)</span></div>}
    </div>
  );
}
