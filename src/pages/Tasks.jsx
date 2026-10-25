import { useMemo, useState } from "react";
import { useStore } from "../store.jsx";
import { DAYS_SHORT, TASK_COLORS, TASK_TEMPLATES } from "../lib/constants";
import { buildEvents, EVENT_SOURCES } from "../lib/events";
import { daysInMonth, fmtDate, monthLabel, monthOf, todayISO, weekdayIdx, daysUntil } from "../lib/utils";
import { Chips, Empty, MonthNav, PageHeader, Tabs } from "../components/ui.jsx";
import { TaskCard, TaskForm } from "../components/TaskParts.jsx";

export default function Tasks() {
  const { data, add } = useStore();
  const [view, setView] = useState("list");
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("open");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [tpl, setTpl] = useState(false);
  const [sticky, setSticky] = useState(() => new Set()); // tasks just toggled stay visible so you can write the result note
  const today = todayISO();

  const list = data.tasks.filter((t) => {
    if (sticky.has(t.id)) return true;
    if (type && t.type !== type) return false;
    if (q && !`${t.title} ${t.description || ""} ${t.contact || ""} ${t.caseNo || ""} ${t.doneNote || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status === "open") return !t.done;
    if (status === "done") return t.done;
    if (status === "today") return !t.done && t.date === today;
    if (status === "late") return !t.done && t.date && daysUntil(t.date) < 0;
    if (status === "follow") return !t.done && (t.followups || []).some((f) => !f.done);
    return true;
  }).sort((a, b) => (a.done - b.done) || (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || ""));

  return (
    <>
      <PageHeader title="Tasks & calendar" sub="Admin, university and personal tasks with follow-ups and documentation.">
        <button className="btn" onClick={() => setTpl(!tpl)}>📋 Ready-made templates</button>
        <button className="btn primary" onClick={() => setForm({})}>＋ New task</button>
      </PageHeader>
      {tpl && (
        <div className="card" style={{ marginBottom: 14 }}>
          <small className="muted">Added to your list with one click (edit the date and details later):</small>
          <div className="chips gap-top">{TASK_TEMPLATES.map((t) => <button key={t.title} className="chip" onClick={() => add("tasks", { ...t, date: "", time: "", description: "", contact: "", phone: "", email: "", address: "", caseNo: "", docs: [], followups: [], done: false, doneNote: "" })}>＋ {t.title}</button>)}</div>
        </div>
      )}
      <Tabs value={view} onChange={setView} tabs={[["list", "☰ List"], ["cal", "📅 Calendar"]]} />
      {view === "list" ? (
        <>
          <div className="filters">
            <Field2 label="Search"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, authority, Aktenzeichen…" /></Field2>
          </div>
          <Chips all={null} value={status} onChange={(v) => { setSticky(new Set()); setStatus(v || "all"); }} options={[["open", "Open"], ["today", "Today"], ["late", "Overdue"], ["follow", "Needs follow-up"], ["done", "Done"], ["all", "All"]]} />
          <div style={{ margin: "10px 0" }}><Chips value={type} onChange={setType} options={data.settings.taskTypes.map((t) => [t, t])} all="All types" /></div>
          <div className="card">{list.length === 0 ? <Empty>No tasks match this filter.</Empty> : list.map((t) => <TaskCard key={t.id} t={t} onEdit={setForm} onToggle={(id) => setSticky((s) => new Set(s).add(id))} />)}</div>
        </>
      ) : <CalendarView onAdd={(date) => setForm({ date })} onEdit={setForm} />}
      {form && <TaskForm initial={form} onClose={() => setForm(null)} />}
    </>
  );
}
const Field2 = ({ label, children }) => <label className="field"><span>{label}</span>{children}</label>;

function CalendarView({ onAdd, onEdit }) {
  const { data } = useStore();
  const [month, setMonth] = useState(monthOf(todayISO()));
  const [sel, setSel] = useState(todayISO());
  const [off, setOff] = useState({});
  const today = todayISO();
  const events = useMemo(() => buildEvents(data).filter((e) => !off[e.src]), [data, off]);
  const first = `${month}-01`;
  const lead = weekdayIdx(first);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  const on = (d) => events.filter((e) => e.date === d);
  const selEvents = on(sel);
  const selTasks = data.tasks.filter((t) => t.date === sel);

  return (
    <>
      <div className="row between" style={{ marginBottom: 10 }}>
        <MonthNav month={month} onChange={(m) => setMonth(m)} />
        <button className="btn sm" onClick={() => { setMonth(monthOf(today)); setSel(today); }}>Today</button>
      </div>
      <div className="chips" style={{ marginBottom: 10 }}>
        {Object.entries(EVENT_SOURCES).map(([k, l]) => <button key={k} className={`chip ${off[k] ? "" : "on"}`} onClick={() => setOff({ ...off, [k]: !off[k] })}>{l}</button>)}
      </div>
      <div className="cal">
        {DAYS_SHORT.map((d) => <div key={d} className="cal-h">{d}</div>)}
        {cells.map((d, i) => d ? (
          <button key={d} className={`cal-day ${d === today ? "today" : ""} ${d === sel ? "sel" : ""}`} onClick={() => setSel(d)}>
            <span className="d">{Number(d.slice(8))}</span>
            {on(d).slice(0, 3).map((e, j) => <span key={j} className={`ev ${e.done ? "done" : ""}`} style={{ background: e.color }}>{e.time ? `${e.time} ` : ""}{e.label}</span>)}
            {on(d).length > 3 && <small className="muted">+{on(d).length - 3}</small>}
            <span className="dots">{on(d).slice(0, 6).map((e, j) => <i key={j} style={{ background: e.color }} />)}</span>
          </button>
        ) : <div key={`x${i}`} />)}
      </div>
      <div className="card gap-top">
        <h2><span>{fmtDate(sel)}</span><button className="btn primary sm" onClick={() => onAdd(sel)}>＋ Task on this day</button></h2>
        {selEvents.length === 0 ? <Empty>No events.</Empty> : (
          <>
            {selTasks.map((t) => <TaskCard key={t.id} t={t} onEdit={onEdit} />)}
            {selEvents.filter((e) => e.src !== "tasks").map((e, i) => <div key={i} className="item" style={{ alignItems: "center" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: e.color }} /><div className="item-main">{e.label}</div></div>)}
          </>
        )}
      </div>
      <small className="muted">{monthLabel(month)} · Each task is colored by its type ({Object.keys(TASK_COLORS).slice(0, 3).join(", ")}, …).</small>
    </>
  );
}
