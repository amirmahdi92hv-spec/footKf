const FA = { W: "ب", D: "م", L: "ش" } as const;
export function FormPills({ form }: { form: ("W" | "D" | "L")[] }) {
  if (!form.length) return <span className="muted" style={{ fontSize: 12 }}>—</span>;
  return <span className="form" aria-label="نتایج اخیر">{[...form].reverse().map((f, i) => <i key={i} className={f}>{FA[f]}</i>)}</span>;
}
