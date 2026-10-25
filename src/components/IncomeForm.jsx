import { useState } from "react";
import { useStore } from "../store.jsx";
import { INCOME_TYPES } from "../lib/constants";
import { payOptions } from "../lib/pay";
import { num, todayISO } from "../lib/utils";
import { Datalist, Field, Modal } from "./ui.jsx";

export default function IncomeForm({ initial, onClose }) {
  const { data, add, update } = useStore();
  const editing = initial?.id && data.income.some((x) => x.id === initial.id);
  const [f, setF] = useState({ date: todayISO(), source: "", type: INCOME_TYPES[0], amount: "", paymentId: data.settings.banks[0]?.id || "cash", note: "", ...initial });
  const set = (p) => setF((s) => ({ ...s, ...p }));
  const sources = [...data.jobs.filter((j) => j.stage === "current").map((j) => j.company), ...data.income.map((x) => x.source)];

  function submit(e) {
    e.preventDefault();
    if (!num(f.amount) || !f.source.trim()) return;
    const rec = { ...f, amount: num(f.amount), source: f.source.trim() };
    if (editing) update("income", f.id, rec);
    else add("income", rec);
    onClose();
  }
  return (
    <Modal title={editing ? "Edit income" : "Add income"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-row">
          <Field label="Source *" grow={2}><input list="inc-src" value={f.source} onChange={(e) => set({ source: e.target.value })} placeholder="e.g. company / family" autoFocus required /></Field>
          <Datalist id="inc-src" options={sources} />
          <Field label="Type"><select value={f.type} onChange={(e) => set({ type: e.target.value })}>{INCOME_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="form-row">
          <Field label="Amount € *"><input inputMode="decimal" value={f.amount} onChange={(e) => set({ amount: e.target.value })} required /></Field>
          <Field label="Date"><input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} required /></Field>
          <Field label="Paid into">
            <select value={f.paymentId} onChange={(e) => set({ paymentId: e.target.value })}>{payOptions(data.settings).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
        </div>
        <Field label="Note"><input value={f.note} onChange={(e) => set({ note: e.target.value })} /></Field>
        <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}
