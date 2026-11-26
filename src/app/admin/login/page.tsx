import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, passwordOk, signSession } from "@/lib/auth";

let fails = 0, blockedUntil = 0; // best-effort per-instance throttle
async function login(fd: FormData) {
  "use server";
  if (Date.now() < blockedUntil) redirect("/admin/login?e=wait");
  if (!(await passwordOk(String(fd.get("password") ?? "")))) {
    if (++fails >= 5) { blockedUntil = Date.now() + 60_000; fails = 0; }
    redirect("/admin/login?e=1");
  }
  fails = 0;
  (await cookies()).set(COOKIE, await signSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 8 * 3600 });
  redirect("/admin");
}
export const metadata = { title: "ورود مدیر", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (<form action={login} className="panel" style={{ maxWidth: 360, margin: "10vh auto", padding: 24, display: "grid", gap: 12 }}>
    <h1 style={{ margin: 0 }}>ورود مدیر</h1>
    <label htmlFor="p">گذرواژه</label>
    <input id="p" name="password" type="password" autoComplete="current-password" required />
    {e && <div className="stale" role="alert">{e === "wait" ? "تلاش‌های زیاد؛ کمی بعد دوباره امتحان کنید." : "گذرواژه نادرست است."}</div>}
    <button className="btn primary">ورود</button>
  </form>);
}
