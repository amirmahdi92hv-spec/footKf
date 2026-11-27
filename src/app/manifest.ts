import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "فوت‌کی‌اف", short_name: "فوت‌کی‌اف", lang: "fa", dir: "rtl", start_url: "/", display: "standalone", background_color: "#060b16", theme_color: "#060b16",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] };
}
