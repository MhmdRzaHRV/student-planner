import { useState } from "react";
import { useStore } from "../store.jsx";
import { DREAM_KINDS, PRIORITIES, QUOTES } from "../lib/constants";
import { daysUntil, fmtDate, num, relDay, sum, todayISO } from "../lib/utils";
import { Badge, confirmDel, Empty, Field, Modal, Money, PageHeader, Progress, Stars, Tabs } from "../components/ui.jsx";

const blank = (kind) => ({ kind, title: "", note: "", target: "", cost: "", link: "", priority: "2", progress: 0, when: "", done: false, rating: 0 });

export default function Future() {
  const { data, add, update, remove, setSettings } = useStore();
  const [kind, setKind] = useState("goal");
  const [form, setForm] = useState(null);
  const today = todayISO();
  const salary = data.settings.firstSalary || 0;

  const all = data.dreams.filter((d) => d.kind === kind);
  const list = [...all].sort((a, b) => Number(a.done) - Number(b.done) || Number(b.priority) - Number(a.priority) || (a.target || "9").localeCompare(b.target || "9"));
  const doneCount = all.filter((d) => d.done).length;

  // paycheck planner: greedily pick the most important wishes that fit into the first salary
  const wishes = data.dreams.filter((d) => d.kind === "paycheck" && !d.done);
  const wishTotal = sum(wishes, (d) => num(d.cost));
  let left = salary;
  const fits = new Set();
  [...wishes].sort((a, b) => Number(b.priority) - Number(a.priority) || num(a.cost) - num(b.cost)).forEach((d) => {
    if (num(d.cost) <= left) {
      fits.add(d.id);
      left -= num(d.cost);
    }
  });
  const tripTotal = sum(data.dreams.filter((d) => d.kind === "trip" && !d.done), (d) => num(d.cost));

  const motivations = data.dreams.filter((d) => d.kind === "motivation");
  const pool = motivations.length ? motivations.map((m) => m.title) : QUOTES;
  const spark = pool[Math.floor(new Date().getDate() + new Date().getMonth() * 3) % pool.length];

  function save(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const rec = { ...form, title: form.title.trim() };
    form.id ? update("dreams", form.id, rec) : add("dreams", rec);
    setForm(null);
  }
  const toggleDone = (d) => update("dreams", d.id, { done: !d.done, doneDate: !d.done ? today : "" });

  const K = DREAM_KINDS[kind];
  const priLabel = (p) => PRIORITIES.find(([k]) => k === String(p))?.[1];

  return (
    <>
      <PageHeader title="Future & dreams" sub="Goals, first-paycheck wishes, places to travel, things to try. Whatever pulls you forward today.">
        <button className="btn primary" onClick={() => setForm(blank(kind))}>＋ {K.add}</button>
      </PageHeader>

      <div className="card"><div className="quote">{spark}</div></div>

      <Tabs value={kind} onChange={setKind} tabs={Object.entries(DREAM_KINDS).map(([k, v]) => [k, `${v.icon} ${v.label} (${data.dreams.filter((d) => d.kind === k).length})`])} />

      {kind === "paycheck" && (
        <div className="card">
          <div className="form-row">
            <Field label="My expected first paycheck (€)"><input inputMode="decimal" value={salary || ""} onChange={(e) => setSettings({ firstSalary: num(e.target.value) })} placeholder="e.g. 600" /></Field>
            <div className="field"><span>Total wishlist</span><strong><Money v={wishTotal} /></strong></div>
            <div className="field"><span>{salary >= wishTotal ? "Left after everything" : "Missing for everything"}</span><strong><Money v={Math.abs(salary - wishTotal)} cls={salary >= wishTotal ? "good" : "bad"} /></strong></div>
          </div>
          {salary > 0 && wishes.length > 0 && <small className="muted">Items marked "fits" are the most important ones that fit into your first paycheck ({fits.size} of {wishes.length}, {left.toFixed(2)} € would remain).</small>}
        </div>
      )}
      {kind === "trip" && tripTotal > 0 && <div className="card">Estimated budget for all planned trips: <strong><Money v={tripTotal} /></strong></div>}

      {all.length > 0 && kind !== "motivation" && (
        <div style={{ margin: "0 0 12px" }}>
          <div className="row between"><small className="muted">{doneCount} of {all.length} done</small></div>
          <Progress value={(doneCount / all.length) * 100} color="var(--good)" />
        </div>
      )}

      {list.length === 0 ? <Empty>Nothing here yet. Add your first one with the button above.</Empty> : (
        <div className="card">
          {list.map((d) => (
            <div className={`item ${d.done ? "dream-done" : ""}`} key={d.id}>
              {kind !== "motivation" && <input type="checkbox" checked={!!d.done} onChange={() => toggleDone(d)} aria-label="Done" style={{ marginTop: 6 }} />}
              <div className="item-main">
                <strong>{kind === "motivation" ? <span className="quote">{d.title}</span> : d.title}</strong>
                <div className="row">
                  {kind !== "motivation" && <small className="muted">{priLabel(d.priority)}</small>}
                  {d.cost !== "" && d.cost != null && num(d.cost) > 0 && <Badge><Money v={num(d.cost)} /></Badge>}
                  {kind === "paycheck" && !d.done && salary > 0 && <Badge color={fits.has(d.id) ? "#16a34a" : "#94a3b8"}>{fits.has(d.id) ? "fits in first paycheck" : "later"}</Badge>}
                  {d.when && <Badge>{d.when}</Badge>}
                  {d.target && <Badge color={!d.done && daysUntil(d.target) < 0 ? "#dc2626" : undefined}>{fmtDate(d.target)} · {relDay(d.target)}</Badge>}
                  {d.link && <a href={d.link} target="_blank" rel="noreferrer">Link ↗</a>}
                </div>
                {d.note && <p className="muted pre">{d.note}</p>}
                {kind === "goal" && <div style={{ maxWidth: 360 }}><Progress value={d.done ? 100 : d.progress || 0} color="var(--good)" /><small className="muted">{d.done ? 100 : d.progress || 0}%</small></div>}
                {d.done && (kind === "trip" || kind === "bucket") && <div className="row"><small className="muted">Done {fmtDate(d.doneDate)} · rate it:</small><Stars value={d.rating || 0} onChange={(v) => update("dreams", d.id, { rating: v })} /></div>}
              </div>
              <div className="actions">
                <button className="btn ghost sm" onClick={() => setForm(d)}>Edit</button>
                <button className="btn ghost sm danger" onClick={() => confirmDel("Delete this item?") && remove("dreams", d.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Edit" : K.add} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Field label={kind === "trip" ? "Place *" : kind === "motivation" ? "Quote / reminder *" : "Title *"}>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus required placeholder={{ goal: "e.g. Pass all first-semester exams", paycheck: "e.g. Good headphones", trip: "e.g. Hamburg, Prague, Iceland", bucket: "e.g. See the northern lights", motivation: "e.g. I moved here for a reason" }[kind]} />
            </Field>
            <div className="form-row">
              {kind !== "motivation" && (
                <Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
              )}
              {(kind === "paycheck" || kind === "trip" || kind === "bucket" || kind === "goal") && (
                <Field label={kind === "trip" ? "Estimated budget (€)" : "Cost (€, optional)"}><input inputMode="decimal" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
              )}
              {kind === "trip" && <Field label="When (e.g. Summer 2027)"><input value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} /></Field>}
              {(kind === "goal" || kind === "bucket") && <Field label="Target date (optional)"><input type="date" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></Field>}
            </div>
            {kind === "goal" && (
              <Field label={`Progress: ${form.progress || 0}%`}><input type="range" min="0" max="100" step="5" value={form.progress || 0} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} /></Field>
            )}
            {(kind === "paycheck" || kind === "trip") && <Field label="Link (optional)"><input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" /></Field>}
            <Field label={kind === "goal" ? "Why does this matter to you?" : "Notes"}><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
