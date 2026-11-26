import { ago } from "@/lib/format";
export function Freshness({ lastOk, lastError }: { lastOk: string | null; lastError?: string | null }) {
  if (!lastOk) return <div className="stale" role="status">هنوز داده‌ای همگام‌سازی نشده است.</div>;
  const stale = Date.now() - new Date(lastOk.endsWith("Z") ? lastOk : lastOk + "Z").getTime() > 30 * 60 * 1000;
  if (!stale && !lastError) return <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 12px" }}>آخرین به‌روزرسانی: {ago(lastOk)}</p>;
  return <div className="stale" role="status">داده‌ها ممکن است قدیمی باشند؛ آخرین به‌روزرسانی موفق {ago(lastOk)}.{lastError ? " دریافت داده از منبع با خطا مواجه شد." : ""}</div>;
}
