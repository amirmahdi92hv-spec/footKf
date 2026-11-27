"use client";
import { useEffect, useState } from "react";
const f = (n: number) => new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(n);
export function Countdown({ to }: { to: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => { const t = () => setLeft(Math.max(0, new Date(to).getTime() - Date.now())); t(); const id = setInterval(t, 1000); return () => clearInterval(id); }, [to]);
  if (left === null) return <span className="cd">&nbsp;</span>;
  if (left === 0) return <span className="cd">در حال شروع…</span>;
  const d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
  return <span className="cd" aria-label="زمان باقی‌مانده تا شروع">{d > 0 ? `${new Intl.NumberFormat("fa-IR").format(d)} روز و ` : ""}{f(h)}:{f(m)}:{f(s)}</span>;
}
