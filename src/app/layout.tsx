import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { TopNav, BottomNav, SearchBox } from "@/components/Nav";
import { LogoMark } from "@/components/Icons";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "فوت‌کی‌اف | نتایج زنده و جدول فوتبال", template: "%s | فوت‌کی‌اف" },
  description: "نتایج زنده، برنامهٔ بازی‌ها، جدول لیگ‌ها و آمار فوتبال به زبان فارسی",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "fa_IR", siteName: SITE_NAME, title: "فوت‌کی‌اف | نتایج زنده و جدول فوتبال", description: "نتایج زنده، برنامهٔ بازی‌ها، جدول لیگ‌ها و آمار فوتبال به زبان فارسی", images: [{ url: "/og.png", width: 1200, height: 630, alt: "فوت‌کی‌اف" }] },
  twitter: { card: "summary_large_image", title: "فوت‌کی‌اف", description: "نتایج زنده، جدول و آمار فوتبال به زبان فارسی", images: ["/og.png"] },
};
export const viewport: Viewport = { themeColor: "#060b16", width: "device-width", initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, alternateName: ["FootKf", "فوت کی اف"], url: SITE_URL, inLanguage: "fa" }) }} />
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
