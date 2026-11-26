import { notFound } from "next/navigation";
import Link from "next/link";
import { playerById } from "@/lib/queries";
export const dynamic = "force-dynamic";

export default async function Player({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await playerById(id) : undefined;
  if (!p) notFound();
  const rows: [string, string | null][] = [["پست", p.position as string | null], ["ملیت", p.nationality as string | null], ["تاریخ تولد", p.birth_date as string | null]];
  return (<><h1>{String(p.name_fa ?? p.name)}</h1>
    <div className="panel">
      <div className="row"><span>تیم فعلی</span><span>{p.team_id ? <Link href={`/teams/${p.team_id}`}>{String(p.team_name)}</Link> : "نامشخص"}</span></div>
      {rows.map(([k, v]) => <div className="row" key={k}><span>{k}</span><span>{v ?? "نامشخص"}</span></div>)}
    </div>
    <p style={{ color: "var(--muted)" }}>آمار فصل و سوابق حرفه‌ای در پلن رایگان منبع داده موجود نیست.</p></>);
}
