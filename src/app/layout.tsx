import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: { default: "فوت‌کی‌اف | FootKf", template: "%s | فوت‌کی‌اف" }, description: "نتایج زنده، جدول و برنامه بازی‌های فوتبال به زبان فارسی" };
export const viewport: Viewport = { themeColor: "#0b1220" };

const links = [["/", "خانه"], ["/matches", "بازی‌ها"], ["/competitions", "لیگ‌ها"], ["/transfers", "نقل‌وانتقالات"], ["/news", "اخبار"], ["/search", "جستجو"]] as const;
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <header className="top"><div className="wrap">
          <Link href="/" className="logo"><i />FootKf</Link>
          <nav className="main" aria-label="ناوبری اصلی">{links.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</nav>
        </div></header>
        <main><div className="wrap">{children}</div></main>
      </body>
    </html>
  );
}
