import { useState } from "react";
import { useStore } from "../store.jsx";
import { CONTACT_CATS } from "../lib/constants";
import { mapsUrl } from "../lib/utils";
import { Badge, Chips, confirmDel, Empty, Field, Modal, PageHeader } from "../components/ui.jsx";

const blank = { name: "", org: "", category: CONTACT_CATS[0], phone: "", email: "", address: "", hours: "", caseNo: "", note: "" };

export default function Contacts() {
  const { data, add, update, remove } = useStore();
  const [form, setForm] = useState(null);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const list = data.contacts.filter((c) => (!cat || c.category === cat) && (!q || Object.values(c).join(" ").toLowerCase().includes(q.toLowerCase()))).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <PageHeader title="Important contacts" sub="Authorities, insurance, university, landlord etc. with addresses and opening hours.">
        <button className="btn primary" onClick={() => setForm(blank)}>＋ Contact</button>
      </PageHeader>
      <div className="filters"><Field label="Search"><input value={q} onChange={(e) => setQ(e.target.value)} /></Field></div>
      <Chips value={cat} onChange={setCat} options={CONTACT_CATS.map((c) => [c, c])} />
      <div className="grid gap-top">
        {list.length === 0 && <Empty>No contacts.</Empty>}
        {list.map((c) => (
          <div className="card" key={c.id}>
            <h2><span>{c.name}</span><Badge>{c.category}</Badge></h2>
            {c.org && <div className="muted">{c.org}</div>}
            <div className="tags">
              {c.phone && <a className="badge" href={`tel:${c.phone}`}>📞 <span className="num">{c.phone}</span></a>}
              {c.email && <a className="badge" href={`mailto:${c.email}`}>✉️ {c.email}</a>}
              {c.address && <a className="badge" href={mapsUrl(c.address)} target="_blank" rel="noreferrer">📍 {c.address}</a>}
              {c.hours && <Badge>🕒 {c.hours}</Badge>}
              {c.caseNo && <Badge>Case no.: <span className="num">{c.caseNo}</span></Badge>}
            </div>
            {c.note && <p className="muted">{c.note}</p>}
            <div className="row"><button className="btn sm" onClick={() => setForm(c)}>Edit</button><button className="btn sm danger" onClick={() => confirmDel() && remove("contacts", c.id)}>Delete</button></div>
          </div>
        ))}
      </div>
      {form && (
        <Modal title={form.id ? "Edit contact" : "New contact"} onClose={() => setForm(null)}>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) return; form.id ? update("contacts", form.id, form) : add("contacts", form); setForm(null); }}>
            <div className="form-row">
              <Field label="Name *" grow={2}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus required /></Field>
              <Field label="Category"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CONTACT_CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            </div>
            <div className="form-row">
              <Field label="Organization / role"><input value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} /></Field>
              <Field label="Case / customer number"><input dir="ltr" value={form.caseNo} onChange={(e) => setForm({ ...form, caseNo: e.target.value })} /></Field>
            </div>
            <div className="form-row">
              <Field label="Phone"><input type="tel" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Email"><input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            </div>
            <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, number, postcode, city" /></Field>
            <Field label="Opening hours"><input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Mo–Fr 8–12" /></Field>
            <Field label="Note"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
