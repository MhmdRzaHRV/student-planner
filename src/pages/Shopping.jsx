import { useRef, useState } from "react";
import { useStore } from "../store.jsx";
import { Chips, Empty, PageHeader } from "../components/ui.jsx";

const SHOP_STORES = ["Aldi", "Lidl", "Rewe", "Edeka", "dm", "Rossmann", "Action", "Apotheke"];

export default function Shopping() {
  const { data, add, update, remove, removeMany } = useStore();
  const [text, setText] = useState("");
  const [store, setStore] = useState("");
  const [filter, setFilter] = useState("");
  const ref = useRef(null);
  const items = data.shopping;
  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  const stores = [...new Set([...SHOP_STORES, ...items.map((i) => i.store).filter(Boolean)])];
  const shown = open.filter((i) => !filter || (filter === "_" ? !i.store : i.store === filter));
  const suggestions = [...new Set(done.map((i) => i.text))].slice(0, 10);

  function addItem(t = text, s = store) {
    if (!t.trim()) return;
    add("shopping", { text: t.trim(), store: s, done: false });
    setText("");
    ref.current?.focus();
  }

  const groups = {};
  shown.forEach((i) => (groups[i.store || "No store"] = [...(groups[i.store || "No store"] || []), i]));

  return (
    <>
      <PageHeader title="Shopping list" sub={`${open.length} items left`}>
        {done.length > 0 && <button className="btn" onClick={() => removeMany("shopping", (i) => i.done)}>Clear bought items ({done.length})</button>}
      </PageHeader>
      <div className="card">
        <form className="row" onSubmit={(e) => { e.preventDefault(); addItem(); }}>
          <input ref={ref} className="grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you need? Type and press Enter…" autoFocus style={{ flex: 1, minWidth: 180 }} />
          <select value={store} onChange={(e) => setStore(e.target.value)} style={{ width: 150 }} aria-label="Store">
            <option value="">Store (optional)</option>
            {stores.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn primary">＋</button>
        </form>
        {suggestions.length > 0 && (
          <div className="chips" style={{ marginTop: 10 }}>
            <small className="muted">Buy again:</small>
            {suggestions.map((s) => <button key={s} className="chip" onClick={() => addItem(s, "")}>{s}</button>)}
          </div>
        )}
      </div>

      {stores.some((s) => open.some((i) => i.store === s)) && (
        <div style={{ margin: "12px 0" }}>
          <Chips value={filter} onChange={setFilter} options={[...stores.filter((s) => open.some((i) => i.store === s)).map((s) => [s, s]), ["_", "No store"]]} />
        </div>
      )}

      <div className="card gap-top">
        {open.length === 0 ? <Empty>The list is empty 🎉</Empty> : Object.entries(groups).map(([g, list]) => (
          <div key={g}>
            <div className="day-head"><span>{g}</span><span>{list.length}</span></div>
            {list.map((i) => (
              <div className="item" key={i.id} style={{ alignItems: "center", padding: "8px 0" }}>
                <input type="checkbox" checked={i.done} onChange={() => update("shopping", i.id, { done: true })} aria-label="Bought" />
                <div className="item-main">{i.text}</div>
                <button className="btn ghost sm danger" onClick={() => remove("shopping", i.id)} aria-label="Delete">✕</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div className="card gap-top">
          <h2>Bought</h2>
          {done.map((i) => (
            <div className="item done" key={i.id} style={{ alignItems: "center", padding: "6px 0" }}>
              <input type="checkbox" checked onChange={() => update("shopping", i.id, { done: false })} aria-label="Restore" />
              <div className="item-main">{i.text}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
