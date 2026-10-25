import { useState } from "react";
import { useStore } from "../store.jsx";
import { TASK_COLORS } from "../lib/constants";
import { daysUntil, fmtDate, mapsUrl, relDay, todayISO, uid } from "../lib/utils";
import { Badge, confirmDel, Field, Modal } from "./ui.jsx";

export function TaskForm({ initial, onClose }) {
  const { data, add, update } = useStore();
  const editing = initial?.id && data.tasks.some((t) => t.id === initial.id);
  const [f, setF] = useState({ title: "", type: data.settings.taskTypes[0], date: "", time: "", description: "", contact: "", phone: "", email: "", address: "", caseNo: "", docs: [], followups: [], done: false, doneNote: "", ...initial });
  const [doc, setDoc] = useState("");
  const set = (p) => setF((s) => ({ ...s, ...p }));
  function submit(e) {
    e.preventDefault();
    if (!f.title.trim()) return;
    editing ? update("tasks", f.id, f) : add("tasks", f);
    onClose();
  }
  return (
    <Modal title={editing ? "Edit task" : "New task"} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="form-row">
          <Field label="Title *" grow={3}><input value={f.title} onChange={(e) => set({ title: e.target.value })} autoFocus required /></Field>
          <Field label="Type"><select value={f.type} onChange={(e) => set({ type: e.target.value })}>{data.settings.taskTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="form-row">
          <Field label="Date"><input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
          <Field label="Time"><input type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} /></Field>
          <Field label="Case number / Aktenzeichen"><input dir="ltr" value={f.caseNo} onChange={(e) => set({ caseNo: e.target.value })} /></Field>
        </div>
        <div className="form-row">
          <Field label="Contact (authority/person)"><input value={f.contact} onChange={(e) => set({ contact: e.target.value })} /></Field>
          <Field label="Phone"><input dir="ltr" type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Email"><input dir="ltr" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        </div>
        <Field label="Address / location"><input value={f.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        <Field label="Description"><textarea value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="gap-top"><strong>Required documents</strong>
          {f.docs.map((d) => (
            <div className="row" key={d.id}><label className="check grow"><input type="checkbox" checked={d.done} onChange={() => set({ docs: f.docs.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)) })} />{d.text}</label><button type="button" className="btn ghost sm" onClick={() => set({ docs: f.docs.filter((x) => x.id !== d.id) })}>✕</button></div>
          ))}
          <div className="row"><input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="e.g. passport, Meldebescheinigung…" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (doc.trim()) { set({ docs: [...f.docs, { id: uid(), text: doc.trim(), done: false }] }); setDoc(""); } } }} style={{ flex: 1 }} /><button type="button" className="btn sm" onClick={() => { if (doc.trim()) { set({ docs: [...f.docs, { id: uid(), text: doc.trim(), done: false }] }); setDoc(""); } }}>＋</button></div>
        </div>
        <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

export function TaskCard({ t, onEdit, onToggle }) {
  const { update, remove } = useStore();
  const [open, setOpen] = useState(false);
  const [fu, setFu] = useState({ date: todayISO(), note: "" });
  const overdue = !t.done && t.date && daysUntil(t.date) < 0;
  const color = TASK_COLORS[t.type] || "#64748b";
  const docsLeft = (t.docs || []).filter((d) => !d.done).length;
  const toggleDone = () => { update("tasks", t.id, { done: !t.done }); onToggle?.(t.id); if (!t.done) setOpen(true); };

  return (
    <div className={`item ${t.done ? "done" : ""}`}>
      <input type="checkbox" checked={t.done} onChange={toggleDone} aria-label="Done" style={{ marginTop: 6 }} />
      <div className="item-main">
        <strong style={{ cursor: "pointer" }} onClick={() => setOpen(!open)}>{t.title}</strong>
        <div className="tags">
          <Badge color={color}>{t.type}</Badge>
          {t.date && <Badge color={overdue ? "#dc2626" : undefined}>{fmtDate(t.date)} {t.time} · {relDay(t.date)}</Badge>}
          {t.contact && <Badge>👤 {t.contact}</Badge>}
          {docsLeft > 0 && <Badge>📎 {docsLeft} document(s) missing</Badge>}
          {(t.followups || []).some((f) => !f.done) && <Badge color="#7c3aed">🔁 Has follow-up</Badge>}
          {t.done && !t.doneNote && <Badge color="#d97706">No result note</Badge>}
        </div>
        {open && (
          <div className="sub-box">
            {t.description && <p style={{ marginTop: 0 }}>{t.description}</p>}
            <div className="tags" style={{ marginBottom: 8 }}>
              {t.caseNo && <Badge>Case no.: <span className="num">{t.caseNo}</span></Badge>}
              {t.phone && <a className="badge" href={`tel:${t.phone}`}>📞 <span className="num">{t.phone}</span></a>}
              {t.email && <a className="badge" href={`mailto:${t.email}`}>✉️ {t.email}</a>}
              {t.address && <a className="badge" href={mapsUrl(t.address)} target="_blank" rel="noreferrer">📍 {t.address}</a>}
            </div>
            {(t.docs || []).length > 0 && (
              <div><strong>Documents</strong>{t.docs.map((d) => <label key={d.id} className="check"><input type="checkbox" checked={d.done} onChange={() => update("tasks", t.id, { docs: t.docs.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)) })} />{d.text}</label>)}</div>
            )}
            <div className="gap-top">
              <strong>🔁 Follow-ups</strong>
              {(t.followups || []).map((f) => (
                <div key={f.id} className={`row ${f.done ? "muted" : ""}`}>
                  <label className="check grow"><input type="checkbox" checked={f.done} onChange={() => update("tasks", t.id, { followups: t.followups.map((x) => (x.id === f.id ? { ...x, done: !x.done } : x)) })} /><span className="num">{fmtDate(f.date)}</span> {f.note}</label>
                  <button className="btn ghost sm" onClick={() => update("tasks", t.id, { followups: t.followups.filter((x) => x.id !== f.id) })}>✕</button>
                </div>
              ))}
              <div className="row">
                <input type="date" value={fu.date} onChange={(e) => setFu({ ...fu, date: e.target.value })} style={{ width: 160 }} />
                <input value={fu.note} onChange={(e) => setFu({ ...fu, note: e.target.value })} placeholder="What should I follow up on?" style={{ flex: 1, minWidth: 140 }} />
                <button className="btn sm" onClick={() => { if (!fu.date) return; update("tasks", t.id, { followups: [...(t.followups || []), { id: uid(), date: fu.date, note: fu.note, done: false }] }); setFu({ date: todayISO(), note: "" }); }}>＋ Follow-up</button>
              </div>
            </div>
            {t.done && (
              <div className="gap-top">
                <Field label="✍️ Result note (for your records)"><textarea value={t.doneNote || ""} onChange={(e) => update("tasks", t.id, { doneNote: e.target.value })} placeholder="What happened? Who said what? Which documents did you hand in? Next step?" /></Field>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="row" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
        <button className="btn ghost sm" onClick={() => setOpen(!open)}>{open ? "Close" : "Details"}</button>
        <button className="btn ghost sm" onClick={() => onEdit(t)}>Edit</button>
        <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("tasks", t.id)}>Delete</button>
      </div>
    </div>
  );
}
