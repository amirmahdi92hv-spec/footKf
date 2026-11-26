import { notFound } from "next/navigation";
import Link from "next/link";
import { teamById, squadOf, teamMatches, teamStanding } from "@/lib/queries";
import { num } from "@/lib/format";
import { MatchList, Empty } from "@/components/MatchList";
import { FavButton } from "@/components/Fav";
export const dynamic = "force-dynamic";

export default async function Team({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const t = Number.isInteger(id) ? await teamById(id) : undefined;
  if (!t) notFound();
  const [squad, recent, next, st] = await Promise.all([squadOf(id), teamMatches(id, false), teamMatches(id, true), teamStanding(id)]);
  return (<>
    <h1>{String(t.name_fa ?? t.name)}</h1>
    <p style={{ color: "var(--muted)" }}>
      {t.venue ? `ورزشگاه: ${t.venue} · ` : ""}{t.coach_name ? `سرمربی: ${t.coach_name} · ` : ""}{t.founded ? `تأسیس: ${num(Number(t.founded))}` : ""}
      {st ? ` · جایگاه در ${st.competition}: ${num(Number(st.position))} (${num(Number(st.points))} امتیاز)` : ""}
    </p>
    <FavButton id={id} name={String(t.name_fa ?? t.name)} />
    <h2>بازی‌های پیش رو</h2>{next.length ? <MatchList rows={next} /> : <Empty title="بازی آینده‌ای ثبت نشده" />}
    <h2>نتایج اخیر</h2>{recent.length ? <MatchList rows={recent} /> : <Empty title="نتیجه‌ای ثبت نشده" />}
    <h2>فهرست بازیکنان</h2>
    {squad.length ? <div className="panel">{squad.map((p) => <Link key={String(p.id)} href={`/players/${p.id}`} className="row"><span>{String(p.name)}</span><small>{String(p.position ?? "—")}</small></Link>)}</div>
      : <Empty title="فهرست بازیکنان در دسترس نیست" hint="هنوز از منبع داده دریافت نشده است." />}
  </>);
}
