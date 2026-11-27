export default function Loading() {
  return (<div className="cols"><div style={{ display: "grid", gap: 14 }}><div className="sk" style={{ height: 210, borderRadius: 20 }} />{[0, 1, 2].map((i) => <div key={i} className="sk" style={{ height: 150 }} />)}</div><div className="side"><div className="sk" style={{ height: 300 }} /><div className="sk" style={{ height: 200 }} /></div></div>);
}
