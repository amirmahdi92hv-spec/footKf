import { notFound } from "next/navigation";
import Link from "next/link";
import { competitionByCode, standingsWithTeams, freshness, topScorers, competitionMatches, formOf } from "@/lib/queries";
import { num, compName } from "@/lib/format";
import { teamFa } from "@/lib/teamNames";
import { Empty, MatchList } from "@/components/MatchList";
import { Freshness } from "@/components/Freshness";
import { Standings } from "@/components/Standings";
import { Tabs } from "@/components/Tabs";
export const dynamic = "force-dynamic";

export default async function Competition({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { code } = await params; const { tab: t } = await searchParams;
  const tab = ["table", "matches", "scorers"].includes(t ?? "") ? t! : "table";
  const c = await competitionByCode(code.toUpperCase());
  if (!c) notFound();
  const id = Number(c.id), fresh = await freshness(`competition:${id}`);
  const title = compName(String(c.code), String(c.name));
  let body: React.ReactNode;
  if (tab === "table") {
    const rows = await standingsWithTeams(id);
    const forms: Record<number, ("W" | "D" | "L")[]> = {};
    await Promise.all(rows.map(async (r) => { forms[Number(r.team_id)] = await formOf(Number(r.team_id)); }));
    body = rows.length ? <Standings rows={rows} code={String(c.code)} forms={forms} /> : <Empty title="جدول رده‌بندی در دسترس نیست" hint="این رقابت هنوز همگام‌سازی نشده یا منبع داده جدول را ارائه نمی‌دهد." />;
  } else if (tab === "matches") {
    const ms = await competitionMatches(id);
    body = ms.length ? <MatchList rows={ms} /> : <Empty title="بازی‌ای ثبت نشده" />;
  } else {
    const sc = await topScorers(id);
    body = sc.length ? <div className="panel rise">{sc.map((x, i) => (
      <Link key={String(x.id)} href={`/players/${x.id}`} className="row"><span style={{ display: "flex", gap: 12, alignItems: "center" }}><span className="rank">{num(i + 1)}</span><span>{String(x.name)}<small>{teamFa(String(x.team ?? ""), null)}{x.assists != null ? ` · ${num(Number(x.assists))} پاس گل` : ""}</small></span></span><span className="num-badge">{num(Number(x.goals))}</span></Link>))}</div>
      : <Empty title="آمار گلزنان در دسترس نیست" />;
  }
  return (<><h1>{title}</h1><Freshness {...fresh} />
    <Tabs base={`/competitions/${c.code}`} current={tab} items={[["table", "جدول"], ["matches", "بازی‌ها"], ["scorers", "گلزنان"]]} />{body}</>);
}
