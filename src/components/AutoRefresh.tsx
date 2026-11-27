"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
/** Re-fetches server data every `seconds` while the tab is visible (used when live matches exist). */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const r = useRouter();
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") r.refresh(); }, seconds * 1000);
    return () => clearInterval(id);
  }, [r, seconds]);
  return null;
}
