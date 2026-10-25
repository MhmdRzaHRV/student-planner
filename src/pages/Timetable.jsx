import { useState } from "react";
import { useStore } from "../store.jsx";
import { COURSE_COLORS, COURSE_TYPES, DAYS, HOURS } from "../lib/constants";
import { addDays, daysUntil, fmtDate, relDay, todayISO, weekDates } from "../lib/utils";
import { Badge, Chips, confirmDel, Empty, Field, Modal, PageHeader, Progress, Tabs } from "../components/ui.jsx";

export default function Timetable() {
  const [tab, setTab] = useState("week");
  return (
    <>
      <PageHeader title="Timetable" sub="Plan your week and log homework and prep for every session." />
      <Tabs value={tab} onChange={setTab} tabs={[["week", "🗓️ Week"], ["hw", "📝 Homework"], ["courses", "🎓 Courses"], ["projects", "🛠️ Projects"], ["exams", "📋 Exams"]]} />
      {tab === "week" && <Week goCourses={() => setTab("courses")} />}
      {tab === "hw" && <Homework />}
      {tab === "courses" && <Courses />}
      {tab === "projects" && <Projects />}
      {tab === "exams" && <Exams />}
    </>
  );
}

/* ───── week grid ───── */
function Week({ goCourses }) {
  const { data } = useStore();
  const { courses, slots, sessions } = data;
  const [ref, setRef] = useState(todayISO());
  const [slotForm, setSlotForm] = useState(null);
  const [sess, setSess] = useState(null);
  const dates = weekDates(ref).slice(0, 5);
  const today = todayISO();
  const course = (id) => courses.find((c) => c.id === id);
  const covered = new Set();
  slots.forEach((s) => { for (let i = 0; i < s.span; i++) covered.add(`${s.day}-${s.start + i}`); });

  return (
    <>
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="row">
          <button className="btn sm" onClick={() => setRef(addDays(ref, -7))}>◀ Previous week</button>
          <button className="btn sm" onClick={() => setRef(today)}>This week</button>
          <button className="btn sm" onClick={() => setRef(addDays(ref, 7))}>Next week ▶</button>
        </div>
        <strong>{fmtDate(dates[0])} — {fmtDate(dates[4])}</strong>
      </div>
      {courses.length === 0 && <div className="banner">First create your courses in the "Courses" tab, then click the cells of the grid. <button className="btn sm" onClick={goCourses}>Create course</button></div>}
      <div className="tt-wrap card" style={{ padding: 10 }}>
        <div className="tt">
          <div />
          {dates.map((d, i) => <div key={d} className={`tt-h ${d === today ? "today" : ""}`}>{DAYS[i]}<small>{fmtDate(d).slice(0, 5)}</small></div>)}
          {HOURS.map((h, r) => <div key={h} className="tt-time" style={{ gridRow: r + 2, gridColumn: 1 }}>{h}</div>)}
          {HOURS.flatMap((_, r) => dates.map((_d, c) => !covered.has(`${c}-${r}`) && (
            <button key={`${c}-${r}`} className="tt-cell" style={{ gridRow: r + 2, gridColumn: c + 2 }} onClick={() => setSlotForm({ day: c, start: r, span: 2 })} aria-label={`Add ${DAYS[c]} ${HOURS[r]}`} />
          )))}
          {slots.map((s) => {
            const c = course(s.courseId);
            if (!c) return null;
            const date = dates[s.day];
            const log = sessions[`${s.id}|${date}`] || {};
            const hasHw = (log.hw && !log.hwDone) || (log.next && !log.nextDone);
            return (
              <button key={s.id} className="tt-slot" style={{ gridRow: `${s.start + 2} / span ${s.span}`, gridColumn: s.day + 2, background: c.color }} onClick={() => setSess({ slot: s, date })}>
                <b>{c.name}</b>
                <small>{s.room || c.room}</small>
                <small>{log.prep ? "📖✓ " : ""}{log.attended ? "🙋✓ " : ""}{hasHw ? "📝" : ""}</small>
              </button>
            );
          })}
        </div>
      </div>
      <small className="muted">Click an empty cell to add a class; click a class to log homework and prep for that session. Rows start at 07:45.</small>
      {slotForm && <SlotForm initial={slotForm} onClose={() => setSlotForm(null)} />}
      {sess && <SessionModal slot={sess.slot} date={sess.date} onClose={() => setSess(null)} />}
    </>
  );
}

function SlotForm({ initial, onClose }) {
  const { data, add } = useStore();
  const [f, setF] = useState({ courseId: data.courses[0]?.id || "", room: "", ...initial });
  const set = (p) => setF((s) => ({ ...s, ...p }));
  function submit(e) {
    e.preventDefault();
    if (!f.courseId) return;
    const span = Math.min(f.span, HOURS.length - f.start);
    const clash = data.slots.some((s) => s.day === f.day && s.start < f.start + span && f.start < s.start + s.span);
    if (clash) return alert("This time slot overlaps with another class.");
    add("slots", { courseId: f.courseId, day: f.day, start: f.start, span, room: f.room });
    onClose();
  }
  return (
    <Modal title={`${DAYS[initial.day]} — ${HOURS[initial.start]}`} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-row">
          <Field label="Course" grow={2}>
            <select value={f.courseId} onChange={(e) => set({ courseId: e.target.value })} required>
              {data.courses.length === 0 && <option value="">Create a course first</option>}
              {data.courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
            </select>
          </Field>
          <Field label="Duration">
            <select value={f.span} onChange={(e) => set({ span: Number(e.target.value) })}>
              <option value={1}>1 row (up to 60 min)</option>
              <option value={2}>2 rows (90 min)</option>
              <option value={3}>3 rows</option>
              <option value={4}>4 rows</option>
            </select>
          </Field>
          <Field label="Room (optional)"><input value={f.room} onChange={(e) => set({ room: e.target.value })} /></Field>
        </div>
        <div className="row"><button className="btn primary" disabled={!data.courses.length}>Add to timetable</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

function SessionModal({ slot, date, onClose }) {
  const { data, setKey, remove } = useStore();
  const c = data.courses.find((x) => x.id === slot.courseId);
  const key = `${slot.id}|${date}`;
  const log = data.sessions[key] || {};
  const put = (patch) => setKey("sessions", (s) => ({ ...s, [key]: { ...(s[key] || {}), ...patch } }));
  function del() {
    if (!confirmDel("Remove this class from the weekly timetable? (Its logged homework will be deleted too.)")) return;
    remove("slots", slot.id);
    setKey("sessions", (s) => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith(`${slot.id}|`))));
    onClose();
  }
  return (
    <Modal title={`${c.name} — ${DAYS[slot.day]} ${fmtDate(date)} (${HOURS[slot.start]})`} onClose={onClose}>
      <div className="row" style={{ marginBottom: 10 }}>
        <label className="check"><input type="checkbox" checked={!!log.prep} onChange={(e) => put({ prep: e.target.checked })} /> 📖 I prepared</label>
        <label className="check"><input type="checkbox" checked={!!log.attended} onChange={(e) => put({ attended: e.target.checked })} /> 🙋 I attended</label>
      </div>
      <Field label="Homework from this session">
        <textarea value={log.hw || ""} onChange={(e) => put({ hw: e.target.value })} />
      </Field>
      <label className="check" style={{ margin: "4px 0 10px" }}><input type="checkbox" checked={!!log.hwDone} onChange={(e) => put({ hwDone: e.target.checked })} /> Done</label>
      <Field label="Homework / prep for the next session">
        <textarea value={log.next || ""} onChange={(e) => put({ next: e.target.value })} />
      </Field>
      <label className="check" style={{ margin: "4px 0 10px" }}><input type="checkbox" checked={!!log.nextDone} onChange={(e) => put({ nextDone: e.target.checked })} /> Done</label>
      <Field label="Session notes"><textarea value={log.note || ""} onChange={(e) => put({ note: e.target.value })} /></Field>
      <div className="row gap-top between">
        <small className="muted">Saved automatically.</small>
        <div className="row"><button className="btn danger" onClick={del}>Remove from timetable</button><button className="btn primary" onClick={onClose}>Close</button></div>
      </div>
    </Modal>
  );
}

/* ───── homework overview ───── */
function Homework() {
  const { data, setKey } = useStore();
  const [showDone, setShowDone] = useState(false);
  const rows = [];
  Object.entries(data.sessions).forEach(([key, log]) => {
    const [slotId, date] = key.split("|");
    const slot = data.slots.find((s) => s.id === slotId);
    const c = slot && data.courses.find((x) => x.id === slot.courseId);
    if (!c) return;
    if (log.hw) rows.push({ key, field: "hwDone", date, c, text: log.hw, done: !!log.hwDone, kind: "Session homework" });
    if (log.next) rows.push({ key, field: "nextDone", date, c, text: log.next, done: !!log.nextDone, kind: "For next session" });
  });
  rows.sort((a, b) => b.date.localeCompare(a.date));
  const list = rows.filter((r) => showDone || !r.done);

  // sessions in the next 7 days without prep
  const today = todayISO();
  const upcoming = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    const wd = (new Date(d + "T12:00").getDay() + 6) % 7;
    if (wd > 4) continue;
    data.slots.filter((s) => s.day === wd).forEach((s) => {
      const c = data.courses.find((x) => x.id === s.courseId);
      if (c && !(data.sessions[`${s.id}|${d}`] || {}).prep) upcoming.push({ d, c, s });
    });
  }
  const toggle = (r) => setKey("sessions", (s) => ({ ...s, [r.key]: { ...s[r.key], [r.field]: !r.done } }));

  return (
    <div className="grid">
      <div className="card">
        <h2>📖 Not yet prepared (next 7 days)</h2>
        {upcoming.length === 0 ? <Empty>Everything is ready ✔</Empty> : upcoming.map(({ d, c, s }) => (
          <div className="item" key={s.id + d} style={{ alignItems: "center" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
            <div className="item-main">{c.name} <small className="muted">{fmtDate(d)} · {relDay(d)} · {HOURS[s.start]}</small></div>
            <button className="btn sm" onClick={() => setKey("sessions", (x) => ({ ...x, [`${s.id}|${d}`]: { ...x[`${s.id}|${d}`], prep: true } }))}>Mark prepared ✔</button>
          </div>
        ))}
      </div>
      <div className="card">
        <h2><span>📝 Homework</span><label className="check"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed</label></h2>
        {list.length === 0 ? <Empty>No open homework. In the "Week" tab, click a session to add some.</Empty> : list.map((r) => (
          <div className={`item ${r.done ? "done" : ""}`} key={r.key + r.field} style={{ alignItems: "center" }}>
            <input type="checkbox" checked={r.done} onChange={() => toggle(r)} />
            <div className="item-main"><strong>{r.text}</strong><div className="tags"><Badge color={r.c.color}>{r.c.name}</Badge><Badge>{r.kind}</Badge><Badge>{fmtDate(r.date)}</Badge></div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── courses ───── */
function Courses() {
  const { data, add, update, remove, removeMany, setKey } = useStore();
  const [form, setForm] = useState(null);
  const blank = { name: "", teacher: "", room: "", type: COURSE_TYPES[0], ects: "", color: COURSE_COLORS[data.courses.length % COURSE_COLORS.length], note: "" };
  function del(c) {
    if (!confirmDel(`Delete the course "${c.name}" along with all its sessions, projects and exams?`)) return;
    const ids = data.slots.filter((s) => s.courseId === c.id).map((s) => s.id);
    remove("courses", c.id);
    removeMany("slots", (s) => s.courseId === c.id);
    removeMany("projects", (p) => p.courseId === c.id);
    removeMany("exams", (p) => p.courseId === c.id);
    setKey("sessions", (s) => Object.fromEntries(Object.entries(s).filter(([k]) => !ids.includes(k.split("|")[0]))));
  }
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}><span className="muted">{data.courses.length} {data.courses.length === 1 ? "course" : "courses"}</span><button className="btn primary" onClick={() => setForm(blank)}>+ New course</button></div>
      <div className="grid">
        {data.courses.length === 0 && <Empty>No courses yet. You can create a separate course for each class type (VL, Übung, Labor).</Empty>}
        {data.courses.map((c) => (
          <div className="card" key={c.id} style={{ borderInlineStart: `6px solid ${c.color}` }}>
            <h2>{c.name}<Badge>{c.type}</Badge></h2>
            <div className="muted">{[c.teacher && `👤 ${c.teacher}`, c.room && `🚪 ${c.room}`, c.ects && `${c.ects} ECTS`].filter(Boolean).join(" · ")}</div>
            {c.note && <p>{c.note}</p>}
            <div className="row"><button className="btn sm" onClick={() => setForm(c)}>Edit</button><button className="btn sm danger" onClick={() => del(c)}>Delete</button></div>
          </div>
        ))}
      </div>
      {form && <CourseForm initial={form} onClose={() => setForm(null)} onSave={(f) => (f.id ? update("courses", f.id, f) : add("courses", f))} />}
    </>
  );
}
function CourseForm({ initial, onClose, onSave }) {
  const [f, setF] = useState(initial);
  const set = (p) => setF((s) => ({ ...s, ...p }));
  return (
    <Modal title={f.id ? "Edit course" : "New course"} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (f.name.trim()) { onSave(f); onClose(); } }}>
        <div className="form-row">
          <Field label="Course name *" grow={2}><input value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus required /></Field>
          <Field label="Type"><select value={f.type} onChange={(e) => set({ type: e.target.value })}>{COURSE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="form-row">
          <Field label="Instructor"><input value={f.teacher} onChange={(e) => set({ teacher: e.target.value })} /></Field>
          <Field label="Room"><input value={f.room} onChange={(e) => set({ room: e.target.value })} /></Field>
          <Field label="ECTS"><input inputMode="numeric" value={f.ects} onChange={(e) => set({ ects: e.target.value })} /></Field>
        </div>
        <div className="form-row">
          <Field label="Color">
            <div className="chips">{COURSE_COLORS.map((c) => <button key={c} type="button" onClick={() => set({ color: c })} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: f.color === c ? "3px solid var(--text)" : "2px solid transparent", cursor: "pointer" }} aria-label={c} />)}</div>
          </Field>
        </div>
        <Field label="Notes (instructor email, Moodle link, ...)"><textarea value={f.note} onChange={(e) => set({ note: e.target.value })} /></Field>
        <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

/* ───── projects ───── */
function Projects() {
  const { data, add, update, remove } = useStore();
  const [form, setForm] = useState(null);
  const [st, setSt] = useState("");
  const blank = { title: "", courseId: "", deadline: "", progress: 0, status: "active", note: "" };
  const list = data.projects.filter((p) => !st || p.status === st).sort((a, b) => (a.deadline || "9").localeCompare(b.deadline || "9"));
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <Chips value={st} onChange={setSt} options={[["active", "In progress"], ["submitted", "Submitted"]]} />
        <button className="btn primary" onClick={() => setForm(blank)}>+ Project</button>
      </div>
      <div className="card">
        {list.length === 0 ? <Empty>No projects.</Empty> : list.map((p) => {
          const c = data.courses.find((x) => x.id === p.courseId);
          return (
            <div key={p.id} className={`item ${p.status === "submitted" ? "done" : ""}`}>
              <div className="item-main">
                <strong>{p.title}</strong>
                <div className="tags">
                  {c && <Badge color={c.color}>{c.name}</Badge>}
                  {p.deadline && <Badge color={p.status !== "submitted" && daysUntil(p.deadline) <= 3 ? "#dc2626" : undefined}>Deadline {fmtDate(p.deadline)} · {relDay(p.deadline)}</Badge>}
                </div>
                <div className="row" style={{ marginTop: 6 }}>
                  <input type="range" min="0" max="100" step="5" value={p.progress} onChange={(e) => update("projects", p.id, { progress: Number(e.target.value) })} style={{ flex: 1 }} aria-label="Progress" />
                  <span className="num">{p.progress}%</span>
                </div>
                <Progress value={p.progress} />
                {p.note && <small className="muted">{p.note}</small>}
              </div>
              <div className="row" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <button className="btn sm" onClick={() => update("projects", p.id, { status: p.status === "submitted" ? "active" : "submitted", progress: p.status === "submitted" ? p.progress : 100 })}>{p.status === "submitted" ? "Reopen" : "✔ Mark submitted"}</button>
                <button className="btn ghost sm" onClick={() => setForm(p)}>Edit</button>
                <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("projects", p.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      {form && (
        <Modal title={form.id ? "Edit project" : "New project"} onClose={() => setForm(null)}>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) return; form.id ? update("projects", form.id, form) : add("projects", form); setForm(null); }}>
            <div className="form-row">
              <Field label="Title *" grow={2}><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus required /></Field>
              <Field label="Course"><select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}><option value="">—</option>{data.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Deadline"><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
            </div>
            <Field label="Notes"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ───── exams ───── */
function Exams() {
  const { data, add, update, remove } = useStore();
  const [form, setForm] = useState(null);
  const blank = { title: "", courseId: "", date: "", time: "", room: "", registerDeadline: "", registered: false, grade: "", note: "" };
  const list = [...data.exams].sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}><span className="muted">{list.length} {list.length === 1 ? "exam" : "exams"}</span><button className="btn primary" onClick={() => setForm(blank)}>+ Exam</button></div>
      <div className="card">
        {list.length === 0 ? <Empty>No exams yet. Track your Prüfungsanmeldung deadline here too.</Empty> : list.map((x) => {
          const c = data.courses.find((k) => k.id === x.courseId);
          const regWarn = !x.registered && x.registerDeadline && daysUntil(x.registerDeadline) <= 14;
          return (
            <div className="item" key={x.id}>
              <div className="item-main">
                <strong>{x.title}</strong>
                <div className="tags">
                  {c && <Badge color={c.color}>{c.name}</Badge>}
                  {x.date && <Badge>{fmtDate(x.date)} {x.time} · {relDay(x.date)}</Badge>}
                  {x.room && <Badge>🚪 {x.room}</Badge>}
                  {x.grade && <Badge color="#16a34a">Grade: {x.grade}</Badge>}
                  <Badge color={x.registered ? "#16a34a" : "#d97706"}>{x.registered ? "Registered" : "Not registered"}</Badge>
                  {x.registerDeadline && <Badge color={regWarn ? "#dc2626" : undefined}>Registration deadline {fmtDate(x.registerDeadline)}</Badge>}
                </div>
                {x.note && <small className="muted">{x.note}</small>}
              </div>
              <div className="row" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <button className="btn sm" onClick={() => update("exams", x.id, { registered: !x.registered })}>{x.registered ? "Unmark registration" : "Mark registered"}</button>
                <button className="btn ghost sm" onClick={() => setForm(x)}>Edit</button>
                <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("exams", x.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      {form && (
        <Modal title={form.id ? "Edit exam" : "New exam"} onClose={() => setForm(null)}>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) return; form.id ? update("exams", form.id, form) : add("exams", form); setForm(null); }}>
            <div className="form-row">
              <Field label="Title *" grow={2}><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus required /></Field>
              <Field label="Course"><select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}><option value="">—</option>{data.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            </div>
            <div className="form-row">
              <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label="Time"><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
              <Field label="Room"><input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
            </div>
            <div className="form-row">
              <Field label="Registration deadline"><input type="date" value={form.registerDeadline} onChange={(e) => setForm({ ...form, registerDeadline: e.target.value })} /></Field>
              <Field label="Grade"><input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></Field>
              <label className="check" style={{ alignSelf: "flex-end", paddingBottom: 8 }}><input type="checkbox" checked={form.registered} onChange={(e) => setForm({ ...form, registered: e.target.checked })} /> I'm registered</label>
            </div>
            <Field label="Notes"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
