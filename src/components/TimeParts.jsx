import { useEffect, useState } from "react";
import { useStore } from "../store.jsx";
import { TIME_CATS } from "../lib/constants";
import { num, todayISO } from "../lib/utils";
import { Field, Modal } from "./ui.jsx";

const needsCourse = (c) => ["class", "study", "lab", "project"].includes(c);

export function LogForm({ initial, onClose, lockCategory }) {
  const { data, add, update } = useStore();
  const editing = initial?.id;
  const [f, setF] = useState({ category: lockCategory || "study", date: todayISO(), h: "", m: "", courseId: "", jobId: "", note: "", ...initial });
  const set = (p) => setF((s) => ({ ...s, ...p }));
  const jobs = data.jobs.filter((j) => j.stage === "current");
  function submit(e) {
    e.preventDefault();
    const minutes = Math.round(num(f.h) * 60 + num(f.m));
    if (minutes <= 0) return;
    const rec = { category: f.category, date: f.date, minutes, courseId: needsCourse(f.category) ? f.courseId : "", jobId: f.category === "work" ? f.jobId : "", note: f.note };
    editing ? update("timeLogs", f.id, rec) : add("timeLogs", rec);
    onClose();
  }
  return (
    <Modal title={editing ? "Edit time entry" : "Log time"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-row">
          {!lockCategory && (
            <Field label="Category"><select value={f.category} onChange={(e) => set({ category: e.target.value })}>{Object.entries(TIME_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
          )}
          <Field label="Date"><input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} required /></Field>
        </div>
        <div className="form-row">
          <Field label="Hours"><input inputMode="decimal" value={f.h} onChange={(e) => set({ h: e.target.value })} placeholder="0" /></Field>
          <Field label="Minutes"><input inputMode="numeric" value={f.m} onChange={(e) => set({ m: e.target.value })} placeholder="0" /></Field>
          {needsCourse(f.category) && !lockCategory && (
            <Field label="Course"><select value={f.courseId} onChange={(e) => set({ courseId: e.target.value })}><option value="">—</option>{data.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          )}
          {f.category === "work" && (
            <Field label="Job"><select value={f.jobId} onChange={(e) => set({ jobId: e.target.value })}><option value="">—</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.company}</option>)}</select></Field>
          )}
        </div>
        <Field label="Note"><input value={f.note} onChange={(e) => set({ note: e.target.value })} /></Field>
        <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

const pad = (n) => String(n).padStart(2, "0");
export function TimerBox({ lockCategory }) {
  const { data, setKey, add } = useStore();
  const t = data.timer;
  const [now, setNow] = useState(Date.now());
  const [cat, setCat] = useState(lockCategory || "study");
  useEffect(() => {
    if (!t) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [t]);
  const sec = t ? Math.max(0, Math.floor((now - t.startedAt) / 1000)) : 0;
  const show = !t || !lockCategory || t.category === lockCategory;

  function stop() {
    const minutes = Math.max(1, Math.round(sec / 60));
    add("timeLogs", { category: t.category, date: todayISO(), minutes, courseId: "", jobId: "", note: "Timer" });
    setKey("timer", null);
  }
  if (!show) return <div className="muted">Another timer ({TIME_CATS[t.category].label}) is running.</div>;
  return (
    <div className="timer">
      {t ? (
        <>
          <span className="big">{pad(Math.floor(sec / 3600))}:{pad(Math.floor((sec % 3600) / 60))}:{pad(sec % 60)}</span>
          <span>{TIME_CATS[t.category].label}</span>
          <button className="btn primary" onClick={stop}>⏹ Stop & save</button>
          <button className="btn ghost" onClick={() => setKey("timer", null)}>Discard</button>
        </>
      ) : (
        <>
          {!lockCategory && <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: 140 }} aria-label="Timer category">{Object.entries(TIME_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>}
          <button className="btn primary" onClick={() => setKey("timer", { category: lockCategory || cat, startedAt: Date.now() })}>▶ Start timer</button>
        </>
      )}
    </div>
  );
}
