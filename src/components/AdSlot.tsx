import { ADS } from "@/lib/ads";
/** Sponsored slot. Renders nothing unless an active entry exists for the slot in src/lib/ads.ts. Always labeled. */
export function AdSlot({ slot }: { slot: "sidebar" | "inline" }) {
  const ad = ADS.find((a) => a.slot === slot && a.active && (!a.until || new Date(a.until) > new Date()));
  if (!ad) return null;
  return <aside className="ad" aria-label="تبلیغ"><small>تبلیغ</small><b>{ad.title}</b><p>{ad.text}</p><a href={ad.url} target="_blank" rel="sponsored noopener noreferrer">{ad.cta}</a></aside>;
}
