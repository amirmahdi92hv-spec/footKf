import Link from "next/link";
import { search } from "@/lib/queries";
export const dynamic = "force-dynamic";
export const metadata = { title: "جستجو" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 60);
  const r = q.length >= 2 ? await search(q) : null;
  return (<><h1>جستجو</h1>
    <form action="/search" role="search" style={{ marginBottom: 16 }}><input className="bigsearch" type="text" name="q" defaultValue={q} placeholder="تیم، بازیکن یا لیگ (حداقل ۲ حرف؛ نام‌ها فعلاً لاتین هستند)" aria-label="جستجو" /></form>
    {r && [["تیم‌ها", r.teams.map((x) => [`/teams/${x.id}`, x.name])], ["بازیکنان", r.players.map((x) => [`/players/${x.id}`, x.name])], ["لیگ‌ها", r.comps.map((x) => [`/competitions/${x.code}`, x.name])]].map(([title, items]) => (
      (items as unknown[][]).length ? <section key={String(title)}><h2>{String(title)}</h2><div className="panel">{(items as unknown[][]).map(([h, n]) => <Link key={String(h)} href={String(h)} className="row">{String(n)}</Link>)}</div></section> : null))}
    {r && !r.teams.length && !r.players.length && !r.comps.length && <div className="state panel"><b>نتیجه‌ای پیدا نشد</b></div>}</>);
}
