import Link from "next/link";
import { shiftYmd, todayYmd, weekdayShort, dayNum } from "@/lib/format";
export function DateStrip({ selected, base = "/matches", extra = "" }: { selected: string; base?: string; extra?: string }) {
  const today = todayYmd();
  const days = Array.from({ length: 11 }, (_, i) => shiftYmd(selected, i - 5));
  return (
    <nav className="strip" aria-label="انتخاب روز">
      {days.map((d) => (
        <Link key={d} className="day" href={`${base}?d=${d}${extra}`} aria-current={d === selected ? "date" : undefined} scroll={false}>
          <span>{weekdayShort(d)}</span><b>{dayNum(d)}</b><i>{d === today ? "امروز" : ""}</i>
        </Link>
      ))}
    </nav>
  );
}
