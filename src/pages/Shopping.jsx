import { useRef, useState } from "react";
import { useStore } from "../store.jsx";
import { Chips, Empty, Money, PageHeader, Tabs } from "../components/ui.jsx";

const SHOP_STORES = ["Aldi", "Lidl", "Rewe", "Edeka", "dm", "Rossmann", "Action", "Apotheke"];

export default function Shopping() {
  const [section, setSection] = useState("everyday");
  return (
    <>
      <PageHeader title="Shopping list" sub="Everyday essentials and major purchases." />
      <Tabs value={section} onChange={setSection} tabs={[["everyday", "Everyday shopping"], ["major", "Major purchases"]]} />
      <ShoppingSection key={section} section={section} />
    </>
  );
}

function ShoppingSection({ section }) {
  const { data, add, update, remove, removeMany } = useStore();
  const [text, setText] = useState("");
  const [store, setStore] = useState("");
  const [filter, setFilter] = useState("");
  const [price, setPrice] = useState("");
  const ref = useRef(null);
  const items = data.shopping.filter((item) => (item.section || "everyday") === section);
  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  const stores = [...new Set([...SHOP_STORES, ...items.map((i) => i.store).filter(Boolean)])];
  const shown = open.filter((i) => !filter || (filter === "_" ? !i.store : i.store === filter));
  const suggestions = [...new Set(done.map((i) => i.text))].slice(0, 10);

  function addItem(t = text, s = store, estimate = price) {
    if (!t.trim()) return;
    const estimatedPrice = section === "major" && estimate !== "" ? Number(estimate) : null;
    if (estimatedPrice !== null && (!Number.isFinite(estimatedPrice) || estimatedPrice < 0)) return;
    add("shopping", { text: t.trim(), store: s, done: false, section, estimatedPrice });
    setText("");
    setPrice("");
    ref.current?.focus();
  }

  const groups = {};
  shown.forEach((i) => (groups[i.store || "No store"] = [...(groups[i.store || "No store"] || []), i]));

  return (
    <>
      <PageHeader title={section === "major" ? "Major purchases" : "Everyday shopping"} sub={`${open.length} items left · ${section === "major" ? "Appliances and important purchases" : "Bread, groceries and daily essentials"}`}>
        {done.length > 0 && <button className="btn" onClick={() => removeMany("shopping", (i) => i.done && (i.section || "everyday") === section)}>Clear bought items ({done.length})</button>}
      </PageHeader>
      <div className="card">
        <form className="row" onSubmit={(e) => { e.preventDefault(); addItem(); }}>
          <input ref={ref} className="grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you need? Type and press Enter…" autoFocus style={{ flex: 1, minWidth: 180 }} />
          <select value={store} onChange={(e) => setStore(e.target.value)} style={{ width: 150 }} aria-label="Store">
            <option value="">Store (optional)</option>
            {stores.map((s) => <option key={s}>{s}</option>)}
          </select>
          {section === "major" && <input type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Approx. price € (optional)" aria-label="Approximate price in euros (optional)" style={{ flex: "1 1 190px" }} />}
          <button className="btn primary">＋</button>
        </form>
        {suggestions.length > 0 && (
          <div className="chips" style={{ marginTop: 10 }}>
            <small className="muted">Buy again:</small>
            {suggestions.map((s) => <button key={s} className="chip" onClick={() => addItem(s, "", "")}>{s}</button>)}
          </div>
        )}
      </div>

      {stores.some((s) => open.some((i) => i.store === s)) && (
        <div style={{ margin: "12px 0" }}>
          <Chips value={filter} onChange={setFilter} options={[...stores.filter((s) => open.some((i) => i.store === s)).map((s) => [s, s]), ["_", "No store"]]} />
        </div>
      )}

      <div className="card gap-top">
        {open.length === 0 ? <Empty>The list is empty 🎉</Empty> : shown.length === 0 ? <Empty>No items for this store.</Empty> : Object.entries(groups).map(([g, list]) => (
          <div key={g}>
            <div className="day-head"><span>{g}</span><span>{list.length}</span></div>
            {list.map((i) => (
              <div className="item" key={i.id} style={{ alignItems: "center", padding: "8px 0" }}>
                <input type="checkbox" checked={i.done} onChange={() => update("shopping", i.id, { done: true })} aria-label="Bought" />
                <div className="item-main">
                  <div>{i.text}</div>
                  {section === "major" && <input type="number" min="0" step="0.01" inputMode="decimal" value={i.estimatedPrice ?? ""} onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0)) update("shopping", i.id, { estimatedPrice: value === "" ? null : Number(value) });
                  }} placeholder="Approx. price € (optional)" aria-label={`Approximate price for ${i.text}`} />}
                  <button className="btn ghost sm" onClick={() => update("shopping", i.id, { section: section === "major" ? "everyday" : "major" })}>
                    {section === "major" ? "Move to everyday" : "Move to major purchases"}
                  </button>
                </div>
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
              <div className="item-main">{i.text}{section === "major" && i.estimatedPrice != null && <span className="muted"> · Approx. <Money v={i.estimatedPrice} /></span>}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
