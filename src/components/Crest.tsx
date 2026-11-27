const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
export function Crest({ src, name, size = 28 }: { src: string | null | undefined; name: string; size?: number }) {
  if (src) return <img className="crest" src={src} alt="" width={size} height={size} loading="lazy" decoding="async" style={{ width: size, height: size }} />;
  const h = hue(name);
  return <span className="crest" aria-hidden style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, hsl(${h} 55% 38%), hsl(${(h + 40) % 360} 55% 28%))` }}>{name.trim().slice(0, 1).toUpperCase()}</span>;
}
