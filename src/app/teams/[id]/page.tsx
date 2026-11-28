import { notFound } from "next/navigation";
import Link from "next/link";
import { teamById, squadOf, teamMatches, teamStanding, formOf } from "@/lib/queries";
import { num } from "@/lib/format";
import { teamFa } from "@/lib/teamNames";
import { MatchList, Empty, Crest } from "@/components/MatchList";
import { FavButton } from "@/components/Fav";
import { FormPills } from "@/components/FormPills";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const t = Number.isInteger(id) ? await teamById(id) : undefined;
  if (!t) return { title: "تیم پیدا نشد", robots: { index: false } };
  const n = teamFa(String(t.name), t.name_fa as string | null);
  return { title: `${n} | بازی‌ها، نتایج و بازیکنان`, description: `برنامه و نتایج بازی‌ها، جایگاه در جدول، فرم اخیر و فهرست بازیکنان ${n}.`, alternates: { canonical: `/teams/${id}` } };
}
const POS: [string, string][] = [["Goalkeeper", "دروازه‌بان‌ها"], ["Defence", "مدافعان"], ["Midfield", "هافبک‌ها"], ["Offence", "مهاجمان"]];

export default async function Team({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const t = Number.isInteger(id) ? await teamById(id) : undefined;
  if (!t) notFound();
  const [squad, recent, next, st, form] = await Promise.all([squadOf(id), teamMatches(id, false), teamMatches(id, true), teamStanding(id), formOf(id)]);
  const name = teamFa(String(t.name), t.name_fa as string | null);
  const groups = POS.map(([k, label]) => [label, squad.filter((p) => p.position === k)] as const).filter(([, l]) => l.length);
  const other = squad.filter((p) => !POS.some(([k]) => k === p.position));
  return (<>
    <section className="phead rise">
      <Crest src={t.crest_url as string | null} name={String(t.name)} size={84} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <h1>{name}</h1>
        <div className="sub">{t.venue ? <span>ورزشگاه: {String(t.venue)}</span> : null}{t.coach_name ? <span>سرمربی: {String(t.coach_name)}</span> : null}{t.founded ? <span>تأسیس: {num(Number(t.founded))}</span> : null}</div>
        <div style={{ marginTop: 10, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>{form.length > 0 && <FormPills form={form} />}<FavButton id={id} name={name} /></div>
      </div>
      {st && <div className="panel pad" style={{ textAlign: "center", minWidth: 120 }}><small className="muted">{String(st.competition)}</small><div style={{ fontSize: 30, fontWeight: 900, color: "var(--accent)" }}>{num(Number(st.position))}</div><small className="muted">{num(Number(st.points))} امتیاز</small></div>}
    </section>
    <div className="cols">
      <div>
        <h2 className="sec" style={{ marginTop: 0 }}>بازی‌های پیش رو</h2>{next.length ? <MatchList rows={next} /> : <Empty title="بازی آینده‌ای ثبت نشده" />}
        <h2 className="sec">نتایج اخیر</h2>{recent.length ? <MatchList rows={recent} /> : <Empty title="نتیجه‌ای ثبت نشده" />}
      </div>
      <aside className="side">
        <h2 className="sec" style={{ marginTop: 0 }}>فهرست بازیکنان</h2>
        {squad.length ? <div className="panel">{[...groups, ...(other.length ? [["سایر", other] as const] : [])].map(([label, list]) => (
          <div key={label}><div className="grp-h">{label}</div>{list.map((p) => <Link key={String(p.id)} href={`/players/${p.id}`} className="row"><span>{String(p.name)}</span><small>{String(p.nationality ?? "")}</small></Link>)}</div>))}</div>
          : <Empty title="فهرست بازیکنان در دسترس نیست" hint="هنوز از منبع داده دریافت نشده است." />}
      </aside>
    </div>
  </>);
}
