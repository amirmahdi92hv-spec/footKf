import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { TopNav, BottomNav, SearchBox } from "@/components/Nav";
import { LogoMark } from "@/components/Icons";

export const metadata: Metadata = {
  title: { default: "فوت‌کی‌اف | نتایج زنده و جدول فوتبال", template: "%s | فوت‌کی‌اف" },
  description: "نتایج زنده، برنامهٔ بازی‌ها، جدول لیگ‌ها و آمار فوتبال به زبان فارسی",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#060b16", width: "device-width", initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <header className="top"><div className="wrap">
          <Link href="/" className="logo" aria-label="فوت‌کی‌اف"><LogoMark />فوت‌<small>کی‌اف</small></Link>
          <TopNav /><SearchBox />
        </div></header>
        <main><div className="wrap">{children}</div></main>
        <BottomNav />
      </body>
    </html>
  );
}
