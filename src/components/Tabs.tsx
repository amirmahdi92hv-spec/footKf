import Link from "next/link";
export function Tabs({ base, current, items }: { base: string; current: string; items: [string, string][] }) {
  return <nav className="tabs" aria-label="بخش‌ها">{items.map(([k, label]) => <Link key={k} href={`${base}?tab=${k}`} aria-current={k === current ? "true" : undefined} scroll={false}>{label}</Link>)}</nav>;
}
