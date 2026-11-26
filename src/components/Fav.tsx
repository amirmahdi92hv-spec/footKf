"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
const KEY = "fk_fav_teams";
type T = { id: number; name: string };
const read = (): T[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };

export function FavButton({ id, name }: T) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(read().some((t) => t.id === id)), [id]);
  const toggle = () => {
    const cur = read().filter((t) => t.id !== id);
    const next = on ? cur : [...cur, { id, name }].slice(-20);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setOn(!on);
  };
  return <button className="btn fav" onClick={toggle} aria-pressed={on}>{on ? "★ در علاقه‌مندی‌ها" : "☆ افزودن به علاقه‌مندی‌ها"}</button>;
}
export function FavTeams() {
  const [list, setList] = useState<T[]>([]);
  useEffect(() => setList(read()), []);
  if (!list.length) return null;
  return (<><h2>تیم‌های مورد علاقه</h2><div className="panel">{list.map((t) => <Link key={t.id} href={`/teams/${t.id}`} className="row">{t.name}</Link>)}</div></>);
}
