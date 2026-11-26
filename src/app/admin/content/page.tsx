import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/adminGuard";
import { addNews, addTransfer, applyOverride, dropOverride, importNewsJson, OVERRIDABLE } from "@/lib/adminActions";
export const dynamic = "force-dynamic";
export const metadata = { title: "مدیریت محتوا", robots: { index: false } };

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const opt = (fd: FormData, k: string) => s(fd, k).trim() || null;

async function newsAction(fd: FormData) { "use server"; await requireAdmin();
  await addNews({ title: s(fd, "title"), summary: opt(fd, "summary"), source_name: s(fd, "source_name"), source_url: s(fd, "source_url") }, "admin"); revalidatePath("/news"); }
async function importAction(fd: FormData) { "use server"; await requireAdmin(); await importNewsJson(s(fd, "json"), "admin"); revalidatePath("/news"); }
async function transferAction(fd: FormData) { "use server"; await requireAdmin();
  await addTransfer({ player_name: s(fd, "player_name"), from_team: opt(fd, "from_team"), to_team: opt(fd, "to_team"), transfer_date: opt(fd, "transfer_date"),
    status: s(fd, "status"), source_name: s(fd, "source_name"), source_url: opt(fd, "source_url") }, "admin"); revalidatePath("/transfers"); }
async function overrideAction(fd: FormData) { "use server"; await requireAdmin();
  await applyOverride({ kind: s(fd, "kind"), id: Number(s(fd, "id")), field: s(fd, "field"), value: s(fd, "value"), reason: s(fd, "reason") }, "admin"); revalidatePath("/admin/content"); }
async function dropAction(fd: FormData) { "use server"; await requireAdmin();
  await dropOverride({ entity: s(fd, "entity"), id: Number(s(fd, "id")), field: s(fd, "field") }, "admin"); revalidatePath("/admin/content"); }

export default async function Content() {
  const ovs = (await db().execute("SELECT * FROM manual_overrides ORDER BY created_at DESC LIMIT 30")).rows;
  const f = (n: string, label: string, req = true) => <label>{label}<input type="text" name={n} required={req} /></label>;
  return (<>
    <h1>مدیریت محتوا</h1>
    <h2>افزودن خبر (فقط عنوان، خلاصهٔ کوتاه و پیوند به منبع)</h2>
    <form action={newsAction} className="panel stack">{f("title", "عنوان")}{f("summary", "خلاصهٔ کوتاه به زبان خودتان", false)}{f("source_name", "نام منبع")}{f("source_url", "آدرس https منبع")}<button className="btn primary">ثبت خبر</button></form>
    <h2>ورود گروهی خبر (JSON)</h2>
    <form action={importAction} className="panel stack"><textarea name="json" dir="ltr" placeholder='[{"title":"...","source_name":"...","source_url":"https://..."}]' required /><button className="btn">وارد کن</button></form>
    <h2>ثبت انتقال تأییدشده</h2>
    <form action={transferAction} className="panel stack">{f("player_name", "بازیکن")}{f("from_team", "از تیم", false)}{f("to_team", "به تیم", false)}{f("transfer_date", "تاریخ (YYYY-MM-DD)", false)}
      <label>وضعیت<select name="status" className="btn"><option value="confirmed">تأییدشده</option><option value="official_announced">اعلام رسمی باشگاه</option></select></label>
      {f("source_name", "منبع")}{f("source_url", "آدرس https منبع", false)}<button className="btn primary">ثبت انتقال</button></form>
    <h2>اصلاح دستی (بر همگام‌سازی خودکار مقدم است)</h2>
    <form action={overrideAction} className="panel stack">
      <label>نوع<select name="kind" className="btn">{Object.keys(OVERRIDABLE).map((k) => <option key={k}>{k}</option>)}</select></label>
      {f("id", "شناسهٔ داخلی")}
      <label>فیلد<select name="field" className="btn">{[...new Set(Object.values(OVERRIDABLE).flatMap((o) => Object.keys(o.fields)))].map((k) => <option key={k}>{k}</option>)}</select></label>
      {f("value", "مقدار جدید")}{f("reason", "دلیل", false)}<button className="btn primary">اعمال</button></form>
    <h2>اصلاح‌های فعال</h2>
    <div className="panel tbl-wrap"><table><thead><tr><th>نوع</th><th>شناسه</th><th>فیلد</th><th>مقدار</th><th></th></tr></thead><tbody>
      {ovs.length ? ovs.map((o) => <tr key={`${o.entity}${o.entity_id}${o.field}`}><td>{String(o.entity)}</td><td>{String(o.entity_id)}</td><td>{String(o.field)}</td><td>{String(o.value)}</td>
        <td><form action={dropAction}><input type="hidden" name="entity" value={String(o.entity)} /><input type="hidden" name="id" value={String(o.entity_id)} /><input type="hidden" name="field" value={String(o.field)} /><button className="btn">حذف</button></form></td></tr>)
        : <tr><td colSpan={5}>اصلاحی ثبت نشده</td></tr>}</tbody></table></div>
  </>);
}
