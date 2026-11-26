import { notFound } from "next/navigation";
import Link from "next/link";
import { matchById, eventsFor } from "@/lib/queries";
import { num, dateFa, timeFa, STATUS_FA } from "@/lib/format";
import { Empty } from "@/components/MatchList";
export const dynamic = "force-dynamic";
const KIND: Record<string, string> = { goal: "⚽ گل", own_goal: "⚽ گل به خودی", penalty: "⚽ گل پنالتی", yellow: "🟨 کارت زرد", red: "🟥 کارت قرمز", sub: "🔁 تعویض" };

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const m = Number.isInteger(id) ? await matchById(id) : undefined;
  if (!m) notFound();
  const ev = await eventsFor(id);
  const has = m.home_score !== null && m.away_score !== null;
  return (<>
    <p style={{ color: "var(--muted)" }}>{m.competition} · {dateFa(m.kickoff_utc)} · {timeFa(m.kickoff_utc)}</p>
    <div className="panel" style={{ padding: 24, textAlign: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
        <Link href={`/teams/${m.home_id}`}><b>{m.home}</b></Link>
        <div className="score" style={{ fontSize: 32 }}>{has ? `${num(m.home_score)} - ${num(m.away_score)}` : "–"}</div>
        <Link href={`/teams/${m.away_id}`}><b>{m.away}</b></Link>
      </div>
      <span className={`pill ${m.status === "live" ? "live" : ""}`}>{STATUS_FA[m.status]}</span>
    </div>
    <h2>رویدادهای بازی</h2>
    {ev.length ? <div className="panel">{ev.map((e) => (
      <div className="ev" key={String(e.id)}><span className="m">{e.minute == null ? "—" : `${num(Number(e.minute))}'`}</span>
        <span>{KIND[String(e.kind)]} — {String(e.player_name ?? "نامشخص")}{e.related_player_name ? ` (${e.kind === "sub" ? "خروج" : "پاس گل"}: ${e.related_player_name})` : ""}</span></div>))}</div>
      : <Empty title="رویدادی در دسترس نیست" hint="منبع داده برای این بازی رویداد ارائه نکرده یا هنوز دریافت نشده است. آمار و ترکیب در پلن رایگان موجود نیست." />}
  </>);
}
