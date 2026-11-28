import { notFound } from "next/navigation";
import Link from "next/link";
import { playerById, playerSeasonStats } from "@/lib/queries";
import { playerBio } from "@/lib/wikipedia";
import { teamFa } from "@/lib/teamNames";
import { dateFa, num, compName } from "@/lib/format";
import { Crest } from "@/components/MatchList";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await playerById(id) : undefined;
  if (!p) return { title: "بازیکن پیدا نشد", robots: { index: false } };
  const stats = await playerSeasonStats(id);
  const n = String(p.name_fa ?? p.name);
  // Thin pages (no season stats) stay out of Google's index until they have real content.
  return { title: `${n} | مشخصات و آمار`, description: `مشخصات، تیم فعلی و آمار فصل ${n}.`, alternates: { canonical: `/players/${id}` }, robots: stats.length ? undefined : { index: false, follow: true } };
}
const POS: Record<string, string> = { Goalkeeper: "دروازه‌بان", Defence: "مدافع", Midfield: "هافبک", Offence: "مهاجم" };

export default async function Player({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await playerById(id) : undefined;
  if (!p) notFound();
  const [bio, stats] = await Promise.all([playerBio(String(p.name)), playerSeasonStats(id)]);
  const age = p.birth_date ? Math.floor((Date.now() - new Date(String(p.birth_date)).getTime()) / 31557600000) : null;
  const facts: [string, string | null][] = [["پست", p.position ? (POS[String(p.position)] ?? String(p.position)) : null], ["ملیت", p.nationality as string | null], ["سن", age ? `${num(age)} سال` : null], ["تاریخ تولد", p.birth_date ? dateFa(`${p.birth_date}T12:00:00Z`) : null]];
  return (<>
    <section className="phead rise">
      <Crest src={null} name={String(p.name)} size={84} />
      <div><h1>{String(p.name_fa ?? p.name)}</h1>
        <div className="sub">{p.team_id ? <Link href={`/teams/${p.team_id}`} style={{ color: "var(--accent)", fontWeight: 700 }}>{teamFa(String(p.team_name), null)}</Link> : <span>بدون تیم ثبت‌شده</span>}</div></div>
    </section>
    <div className="panel facts rise" style={{ ["--i" as string]: 1 }}>{facts.map(([k, v]) => <div key={k}><small>{k}</small><b>{v ?? "نامشخص"}</b></div>)}</div>
    {stats.length > 0 && <><h2 className="sec">آمار فصل جاری</h2>{stats.map((x) => (
      <div key={String(x.code)} className="panel facts rise" style={{ ["--i" as string]: 2, marginBottom: 10 }}>
        <div><small>رقابت</small><b>{compName(String(x.code), String(x.competition))}</b></div>
        <div><small>بازی</small><b>{x.played != null ? num(Number(x.played)) : "—"}</b></div>
        <div><small>گل</small><b style={{ color: "var(--accent)" }}>{num(Number(x.goals))}</b></div>
        <div><small>پاس گل</small><b>{x.assists != null ? num(Number(x.assists)) : "—"}</b></div>
        <div><small>پنالتی</small><b>{x.penalties != null ? num(Number(x.penalties)) : "—"}</b></div>
      </div>))}</>}
    {bio && <><h2 className="sec">دربارهٔ بازیکن</h2><div className="panel bio rise" style={{ ["--i" as string]: 2 }} lang={bio.lang} dir={bio.lang === "fa" ? "rtl" : "ltr"}>{bio.text}
      <footer dir="rtl">منبع: <a href={bio.url} target="_blank" rel="noopener noreferrer">ویکی‌پدیا ({bio.title})</a> — تحت مجوز CC BY-SA 4.0</footer></div></>}
  </>);
}
