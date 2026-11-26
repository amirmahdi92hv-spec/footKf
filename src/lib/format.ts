const fa = "fa-IR";
export const num = (n: number | null | undefined) => (n == null ? "—" : new Intl.NumberFormat(fa).format(n));
export const timeFa = (iso: string) => new Intl.DateTimeFormat(fa, { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }).format(new Date(iso));
export const dateFa = (iso: string) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Tehran" }).format(new Date(iso));
export const ago = (iso: string | null) => {
  if (!iso) return null;
  const m = Math.round((Date.now() - new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime()) / 60000);
  if (m < 1) return "لحظاتی پیش";
  if (m < 60) return `${num(m)} دقیقه پیش`;
  if (m < 1440) return `${num(Math.round(m / 60))} ساعت پیش`;
  return `${num(Math.round(m / 1440))} روز پیش`;
};
export const STATUS_FA: Record<string, string> = {
  scheduled: "برنامه‌ریزی‌شده", live: "زنده", paused: "پایان نیمه", finished: "پایان یافته",
  postponed: "به تعویق افتاده", cancelled: "لغو شده", abandoned: "نیمه‌تمام",
};
/** Tehran calendar day bounds as UTC ISO strings for a YYYY-MM-DD (Gregorian) date. */
export function dayRangeUtc(ymd: string) {
  const start = new Date(`${ymd}T00:00:00+03:30`);
  return [start.toISOString(), new Date(start.getTime() + 864e5).toISOString()] as const;
}
export const todayYmd = () => new Date(Date.now() + 3.5 * 36e5).toISOString().slice(0, 10);
export const shiftYmd = (ymd: string, d: number) => new Date(new Date(`${ymd}T12:00:00Z`).getTime() + d * 864e5).toISOString().slice(0, 10);
