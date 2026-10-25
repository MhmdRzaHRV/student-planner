import { useState } from "react";
import { useStore } from "../store.jsx";
import { LETTER_STATUS } from "../lib/constants";
import { byDateDesc, daysUntil, fmtDate, relDay, todayISO } from "../lib/utils";
import { Badge, Chips, confirmDel, Datalist, Empty, Field, Modal, PageHeader } from "../components/ui.jsx";

const STATUS_COLOR = { new: "#2563eb", todo: "#dc2626", replied: "#d97706", done: "#16a34a" };

export default function Letters() {
  const { data, add, update, remove } = useStore();
  const [form, setForm] = useState(null);
  const [st, setSt] = useState("");
  const [dir, setDir] = useState("");
  const [q, setQ] = useState("");
  const blank = { date: todayISO(), direction: "in", sender: "", subject: "", status: "new", deadline: "", note: "" };
  const list = data.letters.filter((l) => (!st || l.status === st) && (!dir || l.direction === dir) && (!q || `${l.sender} ${l.subject} ${l.note}`.toLowerCase().includes(q.toLowerCase()))).sort(byDateDesc);
  const urgent = data.letters.filter((l) => l.status !== "done" && l.deadline && daysUntil(l.deadline) <= 7).length;

  function makeTask(l) {
    add("tasks", { title: `Reply to letter: ${l.subject}`, type: "Other", date: l.deadline || "", time: "", description: `Sender: ${l.sender}\n${l.note || ""}`, contact: l.sender, phone: "", email: "", address: "", caseNo: "", docs: [], followups: [], done: false, doneNote: "" });
    update("letters", l.id, { status: "todo" });
  }

  return (
    <>
      <PageHeader title="Letters" sub={urgent ? `⚠️ ${urgent} letter(s) with a deadline coming up` : "Keep letters from authorities, insurance, university etc. here."}>
        <button className="btn primary" onClick={() => setForm(blank)}>＋ Letter</button>
      </PageHeader>
      <div className="filters"><Field label="Search"><input value={q} onChange={(e) => setQ(e.target.value)} /></Field></div>
      <Chips value={st} onChange={setSt} options={Object.entries(LETTER_STATUS)} />
      <div style={{ margin: "10px 0" }}><Chips value={dir} onChange={setDir} options={[["in", "Received"], ["out", "Sent"]]} all="All directions" /></div>
      <div className="card">
        {list.length === 0 ? <Empty>No letters.</Empty> : list.map((l) => (
          <div className="item" key={l.id}>
            <div className="item-main">
              <strong>{l.direction === "out" ? "📤" : "📥"} {l.subject}</strong>
              <div className="tags">
                <Badge color={STATUS_COLOR[l.status]}>{LETTER_STATUS[l.status]}</Badge>
                <Badge>{l.sender}</Badge><Badge>{fmtDate(l.date)}</Badge>
                {l.deadline && <Badge color={l.status !== "done" && daysUntil(l.deadline) <= 3 ? "#dc2626" : "#d97706"}>Frist: {fmtDate(l.deadline)} · {relDay(l.deadline)}</Badge>}
              </div>
              {l.note && <small className="muted">{l.note}</small>}
              <div className="row" style={{ marginTop: 6 }}>
                <select value={l.status} onChange={(e) => update("letters", l.id, { status: e.target.value })} style={{ width: 150 }} aria-label="Status">{Object.entries(LETTER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                <button className="btn sm" onClick={() => makeTask(l)}>➜ Create task</button>
              </div>
            </div>
            <div className="row" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <button className="btn ghost sm" onClick={() => setForm(l)}>Edit</button>
              <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("letters", l.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {form && (
        <Modal title={form.id ? "Edit letter" : "New letter"} onClose={() => setForm(null)}>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.subject.trim()) return; form.id ? update("letters", form.id, form) : add("letters", form); setForm(null); }}>
            <div className="form-row">
              <Field label="Subject *" grow={2}><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} autoFocus required /></Field>
              <Field label="Direction"><select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option value="in">Received</option><option value="out">Sent</option></select></Field>
            </div>
            <div className="form-row">
              <Field label="Sender / recipient" grow={2}><input list="l-senders" value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} /></Field>
              <Datalist id="l-senders" options={[...data.contacts.map((c) => c.name), ...data.letters.map((l) => l.sender)]} />
              <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label="Reply deadline (Frist)"><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
            </div>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{Object.entries(LETTER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Note / summary"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
