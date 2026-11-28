/** Canonical origin. Set NEXT_PUBLIC_SITE_URL in Vercel when you attach a custom domain. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://foot-kf.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "فوت‌کی‌اف";
