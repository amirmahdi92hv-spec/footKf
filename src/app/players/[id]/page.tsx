import { notFound } from "next/navigation";
import Link from "next/link";
import { playerById } from "@/lib/queries";
import { playerBio } from "@/lib/wikipedia";
import { teamFa } from "@/lib/teamNames";
import { dateFa, num } from "@/lib/format";
import { Crest } from "@/components/MatchList";
export const dynamic = "force-dynamic";
const POS: Record<string, string> = { Goalkeeper: "دروازه‌بان", Defence: "مدافع", Midfield: "هافبک", Offence: "مهاجم" };

export default async function Player({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await playerById(id) : undefined;
  if (!p) notFound();
  const bio = await playerBio(String(p.name));
  const age = p.birth_date ? Math.floor((Date.now() - new Date(String(p.birth_date)).getTime()) / 31557600000) : null;
  const facts: [string, string | null][] = [["پست", p.position ? (POS[String(p.position)] ?? String(p.position)) : null], ["ملیت", p.nationality as string | null], ["سن", age ? `${num(age)} سال` : null], ["تاریخ تولد", p.birth_date ? dateFa(`${p.birth_date}T12:00:00Z`) : null]];
  return (<>
    <section className="phead rise">
      <Crest src={null} name={String(p.name)} size={84} />
      <div><h1>{String(p.name_fa ?? p.name)}</h1>
        <div className="sub">{p.team_id ? <Link href={`/teams/${p.team_id}`} style={{ color: "var(--accent)", fontWeight: 700 }}>{teamFa(String(p.team_name), null)}</Link> : <span>بدون تیم ثبت‌شده</span>}</div></div>
    </section>
    <div className="panel facts rise" style={{ ["--i" as string]: 1 }}>{facts.map(([k, v]) => <div key={k}><small>{k}</small><b>{v ?? "نامشخص"}</b></div>)}</div>
    {bio && <><h2 className="sec">دربارهٔ بازیکن</h2><div className="panel bio rise" style={{ ["--i" as string]: 2 }} lang={bio.lang} dir={bio.lang === "fa" ? "rtl" : "ltr"}>{bio.text}
      <footer dir="rtl">منبع: <a href={bio.url} target="_blank" rel="noopener noreferrer">ویکی‌پدیا ({bio.title})</a> — تحت مجوز CC BY-SA 4.0</footer></div></>}
  </>);
}
