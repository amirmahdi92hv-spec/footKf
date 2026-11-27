"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IHome, IBall, ITrophy, ISwap, INews, ISearch } from "./Icons";

const items = [["/", "خانه", IHome], ["/matches", "بازی‌ها", IBall], ["/competitions", "لیگ‌ها", ITrophy], ["/transfers", "نقل‌وانتقالات", ISwap], ["/news", "اخبار", INews]] as const;
const active = (p: string, h: string) => (h === "/" ? p === "/" : p.startsWith(h));

export function TopNav() {
  const p = usePathname();
  return <nav className="main" aria-label="ناوبری اصلی">{items.map(([h, l]) => <Link key={h} href={h} aria-current={active(p, h) ? "page" : undefined}>{l}</Link>)}</nav>;
}
export function BottomNav() {
  const p = usePathname();
  return <nav className="bottom" aria-label="ناوبری موبایل">{items.map(([h, l, I]) => <Link key={h} href={h} aria-current={active(p, h) ? "page" : undefined}><I />{l === "نقل‌وانتقالات" ? "انتقال‌ها" : l}</Link>)}</nav>;
}
export const SearchBox = () => (
  <form className="hsearch" action="/search" role="search"><ISearch /><input type="text" name="q" placeholder="جستجوی تیم، بازیکن، لیگ…" aria-label="جستجو" autoComplete="off" /></form>
);
