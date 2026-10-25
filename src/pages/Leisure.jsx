import { useState } from "react";
import { useStore } from "../store.jsx";
import { LEISURE_CATS } from "../lib/constants";
import { fmtDate, mapsUrl, todayISO } from "../lib/utils";
import { Badge, Chips, confirmDel, Empty, Field, Modal, PageHeader, Stars, Tabs } from "../components/ui.jsx";

const blank = { title: "", category: LEISURE_CATS[0], address: "", plannedDate: "", estCost: "", note: "", done: false, rating: 0, visitedDate: "", review: "" };

export default function Leisure() {
  const { data, add, update, remove } = useStore();
  const [tab, setTab] = useState("want");
  const [form, setForm] = useState(null);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const base = data.leisure.filter((l) => (!cat || l.category === cat) && (!q || `${l.title} ${l.address} ${l.note}`.toLowerCase().includes(q.toLowerCase())));
  const want = base.filter((l) => !l.done).sort((a, b) => (a.plannedDate || "9").localeCompare(b.plannedDate || "9"));
  const seen = base.filter((l) => l.done).sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.visitedDate || "").localeCompare(a.visitedDate || ""));
  const list = tab === "want" ? want : seen;
  return (
    <>
      <PageHeader title="Leisure" sub="Places you want to visit; tick them off after you go and rate them.">
        <button className="btn primary" onClick={() => setForm(blank)}>＋ New place</button>
      </PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[["want", `🗺️ Want to go (${data.leisure.filter((l) => !l.done).length})`], ["seen", `⭐ Visited (${data.leisure.filter((l) => l.done).length})`]]} />
      <div className="filters"><Field label="Search"><input value={q} onChange={(e) => setQ(e.target.value)} /></Field></div>
      <Chips value={cat} onChange={setCat} options={LEISURE_CATS.map((c) => [c, c])} />
      <div className="card gap-top">
        {list.length === 0 ? <Empty>{tab === "want" ? "No places added yet." : "You haven't ticked off any place yet."}</Empty> : list.map((l) => (
          <div className={`item`} key={l.id}>
            <input type="checkbox" checked={l.done} style={{ marginTop: 6 }} aria-label="Visited" onChange={() => { update("leisure", l.id, l.done ? { done: false } : { done: true, visitedDate: todayISO() }); setTab(l.done ? "want" : "seen"); }} />
            <div className="item-main">
              <strong>{l.title}</strong>
              <div className="tags">
                <Badge>{l.category}</Badge>
                {l.estCost && <Badge>≈ {l.estCost} €</Badge>}
                {l.plannedDate && !l.done && <Badge color="#c026d3">Planned: {fmtDate(l.plannedDate)}</Badge>}
                {l.done && l.visitedDate && <Badge color="#16a34a">Visited: {fmtDate(l.visitedDate)}</Badge>}
                {l.address && <a className="badge" href={mapsUrl(l.address)} target="_blank" rel="noreferrer">📍 {l.address}</a>}
              </div>
              {l.note && <small className="muted">{l.note}</small>}
              {l.done && (
                <div className="row" style={{ marginTop: 4 }}>
                  <Stars value={l.rating} onChange={(n) => update("leisure", l.id, { rating: n })} />
                  <input value={l.review || ""} onChange={(e) => update("leisure", l.id, { review: e.target.value })} placeholder="Short review…" style={{ flex: 1, minWidth: 140 }} />
                </div>
              )}
            </div>
            <div className="row" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <button className="btn ghost sm" onClick={() => setForm(l)}>Edit</button>
              <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("leisure", l.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {form && (
        <Modal title={form.id ? "Edit place" : "New place"} onClose={() => setForm(null)}>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) return; form.id ? update("leisure", form.id, form) : add("leisure", form); setForm(null); }}>
            <div className="form-row">
              <Field label="Name *" grow={2}><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus required /></Field>
              <Field label="Category"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{LEISURE_CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            </div>
            <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Used to open it on the map" /></Field>
            <div className="form-row gap-top">
              <Field label="Planned date"><input type="date" value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} /></Field>
              <Field label="Estimated cost €"><input inputMode="decimal" value={form.estCost} onChange={(e) => setForm({ ...form, estCost: e.target.value })} /></Field>
            </div>
            <Field label="Note"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
