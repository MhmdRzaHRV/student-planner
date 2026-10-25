import { useState } from "react";
import { useStore } from "../store.jsx";
import { DAYS, DAYS_SHORT, ROUTINE_TEMPLATE } from "../lib/constants";
import { addDays, fmtDate, pct, relDay, todayISO, uid, weekdayIdx } from "../lib/utils";
import { confirmDel, Empty, Field, Modal, PageHeader, Progress, Stat, Tabs } from "../components/ui.jsx";

function useRoutineStats() {
  const { data } = useStore();
  const dayInfo = (d) => {
    const wd = weekdayIdx(d);
    const rs = data.routines.filter((r) => r.days.includes(wd));
    const ids = rs.flatMap((r) => r.items.map((i) => i.id));
    const chk = data.routineChecks[d] || {};
    const done = ids.filter((id) => chk[id]).length;
    return { rs, total: ids.length, done, pct: pct(done, ids.length), chk };
  };
  return dayInfo;
}

export default function Routine() {
  const { data, setKey, add, update, remove } = useStore();
  const dayInfo = useRoutineStats();
  const [tab, setTab] = useState("day");
  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState(null);
  const today = todayISO();
  const info = dayInfo(date);

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = addDays(today, -i);
    const x = dayInfo(d);
    if (!x.total) continue;
    if (x.pct === 100) streak++;
    else if (i > 0) break;
  }
  const heat = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const toggle = (id) => setKey("routineChecks", (c) => ({ ...c, [date]: { ...(c[date] || {}), [id]: !(c[date] || {})[id] } }));

  return (
    <>
      <PageHeader title="Daily routine" sub="Build routines; each day's checklist is prepared automatically.">
        <button className="btn primary" onClick={() => setForm({ name: "", days: [0, 1, 2, 3, 4], items: [{ id: uid(), text: "", time: "" }] })}>＋ New routine</button>
      </PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[["day", "☑️ Day checklist"], ["manage", "🛠️ Manage routines"]]} />

      {tab === "day" && (
        <>
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="row">
              <button className="btn sm" onClick={() => setDate(addDays(date, -1))}>◀</button>
              <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: 160 }} />
              <button className="btn sm" onClick={() => setDate(addDays(date, 1))}>▶</button>
              {date !== today && <button className="btn sm" onClick={() => setDate(today)}>Today</button>}
            </div>
            <strong>{DAYS[weekdayIdx(date)]} · {relDay(date)}</strong>
          </div>
          <div className="grid stats">
            <Stat label="Completed" value={`${info.done}/${info.total}`} tone={info.total && info.pct === 100 ? "good" : ""} />
            <Stat label="Perfect-day streak 🔥" value={streak} />
          </div>
          {info.total > 0 && <div style={{ margin: "12px 0" }}><Progress value={info.pct} color="var(--good)" /></div>}
          {info.rs.length === 0 ? <Empty>No routine for this day. Create one under "Manage routines".{data.routines.length === 0 && <div className="gap-top"><button className="btn" onClick={() => add("routines", { ...ROUTINE_TEMPLATE, items: ROUTINE_TEMPLATE.items.map((i) => ({ ...i, id: uid() })) })}>Add a sample routine</button></div>}</Empty> : (
            <div className="grid">
              {info.rs.map((r) => {
                const d = r.items.filter((i) => info.chk[i.id]).length;
                return (
                  <div className="card" key={r.id}>
                    <h2><span>{r.name}</span><small className="muted">{d}/{r.items.length}</small></h2>
                    {[...r.items].sort((a, b) => (a.time || "99").localeCompare(b.time || "99")).map((i) => (
                      <label key={i.id} className={`item check ${info.chk[i.id] ? "done" : ""}`} style={{ alignItems: "center", padding: "8px 0" }}>
                        <input type="checkbox" checked={!!info.chk[i.id]} onChange={() => toggle(i.id)} />
                        <span className="item-main" style={{ textDecoration: info.chk[i.id] ? "line-through" : "none", color: info.chk[i.id] ? "var(--muted)" : undefined }}>{i.text}</span>
                        {i.time && <small className="muted num">{i.time}</small>}
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <div className="card gap-top">
            <h2>Last 30 days</h2>
            <div className="heat">
              {heat.map((d) => {
                const x = dayInfo(d);
                return <i key={d} title={`${fmtDate(d)}: ${x.total ? x.pct + "%" : "no routine"}`} style={{ background: x.total ? `color-mix(in srgb, var(--good) ${x.pct}%, var(--bg))` : undefined, outline: d === date ? "2px solid var(--accent)" : "none", cursor: "pointer" }} onClick={() => setDate(d)} />;
              })}
            </div>
          </div>
        </>
      )}

      {tab === "manage" && (
        <div className="grid">
          {data.routines.length === 0 && <Empty>No routines yet.</Empty>}
          {data.routines.map((r) => (
            <div className="card" key={r.id}>
              <h2>{r.name}</h2>
              <div className="muted">{r.days.map((d) => DAYS[d]).join(", ") || "—"}</div>
              <ol>{r.items.map((i) => <li key={i.id}>{i.time && <span className="num muted">{i.time} </span>}{i.text}</li>)}</ol>
              <div className="row"><button className="btn sm" onClick={() => setForm(r)}>Edit</button><button className="btn sm danger" onClick={() => confirmDel("Delete this routine?") && remove("routines", r.id)}>Delete</button></div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Edit routine" : "New routine"} onClose={() => setForm(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const items = form.items.filter((i) => i.text.trim());
            if (!form.name.trim() || !items.length) return;
            const rec = { ...form, items };
            form.id ? update("routines", form.id, rec) : add("routines", rec);
            setForm(null);
          }}>
            <Field label="Routine name *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning, Evening, University day" autoFocus required /></Field>
            <div style={{ margin: "10px 0" }}>
              <small className="muted">Days of the week</small>
              <div className="chips">{DAYS_SHORT.map((d, i) => <button type="button" key={i} title={DAYS[i]} className={`chip ${form.days.includes(i) ? "on" : ""}`} onClick={() => setForm({ ...form, days: form.days.includes(i) ? form.days.filter((x) => x !== i) : [...form.days, i] })}>{DAYS[i]}</button>)}</div>
            </div>
            <strong>Items</strong>
            {form.items.map((it) => (
              <div className="row" key={it.id} style={{ margin: "6px 0", flexWrap: "nowrap" }}>
                <input type="time" value={it.time} onChange={(e) => setForm({ ...form, items: form.items.map((x) => (x.id === it.id ? { ...x, time: e.target.value } : x)) })} style={{ width: 120 }} aria-label="Time" />
                <input value={it.text} onChange={(e) => setForm({ ...form, items: form.items.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)) })} placeholder="e.g. 30 minutes of German" style={{ flex: 1 }} />
                <button type="button" className="btn ghost sm" onClick={() => setForm({ ...form, items: form.items.filter((x) => x.id !== it.id) })}>✕</button>
              </div>
            ))}
            <button type="button" className="btn sm" onClick={() => setForm({ ...form, items: [...form.items, { id: uid(), text: "", time: "" }] })}>＋ Item</button>
            <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
