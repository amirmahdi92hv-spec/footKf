import { notFound } from "next/navigation";
import { competitionByCode, standingsFor, topScorers, freshness } from "@/lib/queries";
import { num, compName } from "@/lib/format";
import { Empty } from "@/components/MatchList";
import { Freshness } from "@/components/Freshness";
export const dynamic = "force-dynamic";

export default async function Competition({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await competitionByCode(code.toUpperCase());
  if (!c) notFound();
  const [rows, fresh, scorers] = await Promise.all([standingsFor(Number(c.id)), freshness(`competition:${c.id}`), topScorers(Number(c.id))]);
  return (<><h1>{compName(String(c.code), String(c.name))}</h1><Freshness {...fresh} />
    {rows.length ? <div className="panel tbl-wrap"><table>
      <caption className="sr-only" style={{ position: "absolute", left: -9999 }}>جدول رده‌بندی</caption>
      <thead><tr><th>#</th><th style={{ textAlign: "start" }}>تیم</th><th>بازی</th><th>برد</th><th>مساوی</th><th>باخت</th><th>گل زده</th><th>گل خورده</th><th>امتیاز</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={String(r.team_id)}><td>{num(Number(r.position))}</td><td className="team">{String(r.name)}</td>
        <td>{num(Number(r.played))}</td><td>{num(Number(r.won))}</td><td>{num(Number(r.draw))}</td><td>{num(Number(r.lost))}</td>
        <td>{num(Number(r.goals_for))}</td><td>{num(Number(r.goals_against))}</td><td className="pts">{num(Number(r.points))}</td></tr>)}</tbody>
    </table></div> : <Empty title="جدول رده‌بندی در دسترس نیست" hint="این رقابت هنوز همگام‌سازی نشده یا منبع داده جدول را ارائه نمی‌دهد." />}<h2>بهترین گلزنان</h2>
    {scorers.length ? <div className="panel tbl-wrap"><table><thead><tr><th>#</th><th style={{ textAlign: "start" }}>بازیکن</th><th style={{ textAlign: "start" }}>تیم</th><th>گل</th><th>پاس گل</th></tr></thead>
      <tbody>{scorers.map((r, i) => <tr key={String(r.id)}><td>{num(i + 1)}</td><td className="team"><a href={`/players/${r.id}`}>{String(r.name)}</a></td><td className="team">{String(r.team ?? "")}</td><td className="pts">{num(Number(r.goals))}</td><td>{r.assists == null ? "—" : num(Number(r.assists))}</td></tr>)}</tbody></table></div>
      : <Empty title="جدول گلزنان در دسترس نیست" />}</>);
}