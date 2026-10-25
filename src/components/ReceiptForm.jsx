import { useState } from "react";
import { useStore } from "../store.jsx";
import { DEFAULT_STORES } from "../lib/constants";
import { payOptions } from "../lib/pay";
import { num, receiptTotal, todayISO, uid } from "../lib/utils";
import { Datalist, Field, Modal, Money } from "./ui.jsx";

const blankItem = (category) => ({ id: uid(), name: "", price: "", category, need: true });

export default function ReceiptForm({ initial, onClose, onSaved }) {
  const { data, add, update } = useStore();
  const { settings, receipts } = data;
  const cats = settings.categories;
  const editing = initial?.id && receipts.some((r) => r.id === initial.id);
  const [f, setF] = useState(() => ({
    store: "", date: todayISO(), paymentId: "cash", note: "", returnDeadline: "",
    ...initial,
    items: initial?.items?.length ? initial.items : [blankItem(cats[0])],
  }));
  const stores = [...new Set([...receipts.map((r) => r.store), ...DEFAULT_STORES])];
  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const setItem = (id, patch) => setF((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const total = receiptTotal(f);

  function submit(e) {
    e.preventDefault();
    const items = f.items.filter((i) => num(i.price) !== 0 || i.name.trim()).map((i) => ({ ...i, price: num(i.price) }));
    if (!f.store.trim() || !items.length) return;
    const rec = { store: f.store.trim(), date: f.date, paymentId: f.paymentId, note: f.note, returnDeadline: f.returnDeadline, items };
    const saved = editing ? (update("receipts", f.id, rec), { ...rec, id: f.id }) : add("receipts", rec);
    onSaved?.(saved);
    onClose();
  }

  return (
    <Modal title={editing ? "Edit receipt" : "New receipt"} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="form-row">
          <Field label="Store name *" grow={2}>
            <input list="stores" value={f.store} onChange={(e) => set({ store: e.target.value })} placeholder="e.g. Lidl" autoFocus required />
          </Field>
          <Datalist id="stores" options={stores} />
          <Field label="Date"><input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} required /></Field>
          <Field label="Payment method">
            <select value={f.paymentId} onChange={(e) => set({ paymentId: e.target.value })}>
              {payOptions(settings).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
        </div>

        <strong>Items</strong>
        <small className="muted"> — for Pfand refunds or discounts, enter a negative price (e.g. -0,25)</small>
        {f.items.map((i) => (
          <div className="form-row sub-box" key={i.id}>
            <Field label="Item" grow={2}><input value={i.name} onChange={(e) => setItem(i.id, { name: e.target.value })} placeholder="e.g. milk" /></Field>
            <Field label="Price €"><input inputMode="decimal" value={i.price} onChange={(e) => setItem(i.id, { price: e.target.value })} placeholder="0,00" /></Field>
            <Field label="Category" grow={1.5}>
              <select value={i.category} onChange={(e) => setItem(i.id, { category: e.target.value })}>
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <label className="check"><input type="checkbox" checked={i.need} onChange={(e) => setItem(i.id, { need: e.target.checked })} /> Need</label>
            {f.items.length > 1 && <button type="button" className="btn ghost sm danger" onClick={() => set({ items: f.items.filter((x) => x.id !== i.id) })} aria-label="Remove item">✕</button>}
          </div>
        ))}
        <button type="button" className="btn sm" onClick={() => set({ items: [...f.items, blankItem(f.items[f.items.length - 1]?.category || cats[0])] })}>＋ Add item</button>

        <div className="form-row gap-top">
          <Field label="Note (optional)" grow={2}><input value={f.note} onChange={(e) => set({ note: e.target.value })} /></Field>
          <Field label="Return deadline (optional)"><input type="date" value={f.returnDeadline || ""} onChange={(e) => set({ returnDeadline: e.target.value })} /></Field>
        </div>
        <div className="sticky-total row between">
          <span>Total: <strong><Money v={total} /></strong></span>
          <div className="row">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary">Save</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
