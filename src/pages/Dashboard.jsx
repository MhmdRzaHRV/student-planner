import { useState } from "react";
import { useStore } from "../store.jsx";
import { DAYS, HOURS, TIME_CATS } from "../lib/constants";
import { buildEvents } from "../lib/events";
import { addDays, daysUntil, fmtDate, fmtMin, minutesOn, monthOf, pct, receiptTotal, relDay, sum, todayISO, weekDates, weekdayIdx, workDaysUsed } from "../lib/utils";
import { Badge, Empty, Money, Progress, Stat } from "../components/ui.jsx";
import ReceiptForm from "../components/ReceiptForm.jsx";
import { TaskForm } from "../components/TaskParts.jsx";
import { LogForm, TimerBox } from "../components/TimeParts.jsx";

export default function Dashboard({ go }) {
  const { data, update, setKey, add } = useStore();
  const [modal, setModal] = useState(null);
  const [quick, setQuick] = useState("");
  const today = todayISO();
  const wd = weekdayIdx(today);
  const { settings } = data;
  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  const classes = wd <= 4 ? data.slots.filter((s) => s.day === wd).sort((a, b) => a.start - b.start) : [];
  const spent = sum(data.receipts.filter((r) => r.date.startsWith(monthOf(today))), receiptTotal);
  const budget = settings.monthlyBudget;
  const open = data.tasks.filter((t) => !t.done && t.date && daysUntil(t.date) <= 0).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = buildEvents(data).filter((e) => !e.done && e.src !== "tasks" && e.date >= today && e.date <= addDays(today, 7)).sort((a, b) => a.date.localeCompare(b.date));
  const upTasks = data.tasks.filter((t) => !t.done && t.date && daysUntil(t.date) > 0 && daysUntil(t.date) <= 7);
  const followDue = data.tasks.flatMap((t) => (t.followups || []).filter((f) => !f.done && f.date <= today && !t.done).map((f) => ({ ...f, title: t.title })));
  const weekLogs = data.timeLogs.filter((l) => weekDates(today).includes(l.date));
  const weekWork = sum(weekLogs.filter((l) => l.category === "work"), (l) => l.minutes) / 60;
  const used = workDaysUsed(data.timeLogs, new Date().getFullYear());
  const german = minutesOn(data.timeLogs, today, "german");
  const urgentLetters = data.letters.filter((l) => l.status !== "done" && l.deadline && daysUntil(l.deadline) <= 7);

  const routineInfo = (() => {
    const rs = data.routines.filter((r) => r.days.includes(wd));
    const ids = rs.flatMap((r) => r.items.map((i) => i.id));
    const chk = data.routineChecks[today] || {};
    return { total: ids.length, done: ids.filter((i) => chk[i]).length };
  })();

  const lowPrep = classes.filter((s) => !(data.sessions[`${s.id}|${today}`] || {}).prep);
  const markPrep = (s) => setKey("sessions", (x) => ({ ...x, [`${s.id}|${today}`]: { ...x[`${s.id}|${today}`], prep: true } }));

  return (
    <>
      <div className="page-head">
        <div><h1>{greeting} 👋</h1><p className="muted">{DAYS[wd]} · {fmtDate(today)}</p></div>
        <div className="row">
          <button className="btn primary" onClick={() => setModal("receipt")}>＋ Expense</button>
          <button className="btn" onClick={() => setModal("task")}>＋ Task</button>
          <button className="btn" onClick={() => setModal("log")}>＋ Time</button>
        </div>
      </div>

      <div className="grid stats">
        <Stat label="Spent this month" value={<Money v={spent} />} sub={budget ? `of ${budget} €` : "Set a budget in Settings"} tone={budget && spent > budget ? "bad" : ""} />
        <Stat label="Today's routine" value={routineInfo.total ? `${routineInfo.done}/${routineInfo.total}` : "—"} tone={routineInfo.total && routineInfo.done === routineInfo.total ? "good" : ""} />
        <Stat label="German today" value={fmtMin(german)} sub={`goal ${settings.germanGoalMin} min`} tone={german >= settings.germanGoalMin ? "good" : ""} />
        <Stat label="Work this week" value={`${weekWork.toFixed(1)}h`} sub={`work days: ${used}/${settings.workDaysLimit}`} tone={weekWork > settings.workHoursWeekLimit ? "bad" : ""} />
      </div>
      {budget > 0 && <div style={{ margin: "12px 0" }}><Progress value={pct(spent, budget)} over={spent > budget} /></div>}

      {(urgentLetters.length > 0 || followDue.length > 0) && (
        <div className="banner gap-top">
          {urgentLetters.map((l) => <div key={l.id}>✉️ Letter deadline "{l.subject}": {relDay(l.deadline)} — <a href="#/letters">Letters</a></div>)}
          {followDue.map((f) => <div key={f.id}>🔁 Follow-up: {f.title} {f.note && `(${f.note})`}</div>)}
        </div>
      )}

      <div className="grid gap-top">
        <div className="card">
          <h2><span>📚 Today's classes</span><button className="btn ghost sm" onClick={() => go("timetable")}>Timetable</button></h2>
          {wd > 4 ? <Empty>It's the weekend 🎉</Empty> : classes.length === 0 ? <Empty>No classes today.</Empty> : classes.map((s) => {
            const c = data.courses.find((x) => x.id === s.courseId);
            if (!c) return null;
            const log = data.sessions[`${s.id}|${today}`] || {};
            return (
              <div className="item" key={s.id} style={{ alignItems: "center" }}>
                <span style={{ width: 8, alignSelf: "stretch", borderRadius: 4, background: c.color }} />
                <div className="item-main"><strong>{c.name}</strong><small className="muted">{HOURS[s.start]} · {s.room || c.room} · {c.type}</small></div>
                {log.prep ? <Badge color="#16a34a">📖 Prepared</Badge> : <button className="btn sm" onClick={() => markPrep(s)}>Mark as prepared</button>}
              </div>
            );
          })}
          {lowPrep.length > 0 && <small className="warn">{lowPrep.length} class(es) not prepared</small>}
        </div>

        <div className="card">
          <h2><span>✅ Due today & overdue</span><button className="btn ghost sm" onClick={() => go("tasks")}>All</button></h2>
          {open.length === 0 ? <Empty>Nothing due.</Empty> : open.map((t) => (
            <div className="item" key={t.id} style={{ alignItems: "center" }}>
              <input type="checkbox" checked={false} onChange={() => update("tasks", t.id, { done: true })} aria-label="Done" />
              <div className="item-main"><strong>{t.title}</strong></div>
              <Badge color={daysUntil(t.date) < 0 ? "#dc2626" : undefined}>{t.time} {relDay(t.date)}</Badge>
            </div>
          ))}
        </div>

        <div className="card">
          <h2><span>🗓️ Next 7 days</span><button className="btn ghost sm" onClick={() => go("tasks")}>Calendar</button></h2>
          {upcoming.length + upTasks.length === 0 ? <Empty>Nothing coming up.</Empty> : [
            ...upTasks.map((t) => ({ date: t.date, label: t.title, color: "#2563eb" })),
            ...upcoming,
          ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10).map((e, i) => (
            <div className="item" key={i} style={{ alignItems: "center", padding: "7px 0" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: e.color }} />
              <div className="item-main">{e.label}</div>
              <small className="muted">{relDay(e.date)}</small>
            </div>
          ))}
        </div>

        <div className="card">
          <h2><span>⏱️ Quick time log</span><button className="btn ghost sm" onClick={() => go("time")}>Stats</button></h2>
          <TimerBox />
          <div className="gap-top">
            {Object.entries(TIME_CATS).map(([k, v]) => {
              const m = sum(weekLogs.filter((l) => l.category === k), (l) => l.minutes);
              return m ? <div key={k} className="row between"><span>{v.label}</span><span className="muted">{fmtMin(m)}</span></div> : null;
            })}
            {weekLogs.length === 0 && <small className="muted">Nothing logged this week yet.</small>}
          </div>
        </div>

        <div className="card">
          <h2><span>🛒 Quick shopping</span><button className="btn ghost sm" onClick={() => go("shopping")}>{data.shopping.filter((s) => !s.done).length} items</button></h2>
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (quick.trim()) { add("shopping", { text: quick.trim(), store: "", done: false }); setQuick(""); } }}>
            <input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Need something?" style={{ flex: 1 }} />
            <button className="btn primary">＋</button>
          </form>
        </div>
      </div>

      {modal === "receipt" && <ReceiptForm initial={{}} onClose={() => setModal(null)} />}
      {modal === "task" && <TaskForm initial={{ date: today }} onClose={() => setModal(null)} />}
      {modal === "log" && <LogForm initial={{}} onClose={() => setModal(null)} />}
    </>
  );
}
