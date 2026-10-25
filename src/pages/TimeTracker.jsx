import { useState } from "react";
import { useStore } from "../store.jsx";
import { TIME_CATS } from "../lib/constants";
import { addMonths, byDateDesc, fmtDate, fmtHM, fmtMin, groupSum, mondayOf, monthDays, monthOf, pct, sum, todayISO, weekDates, workDaysUsed } from "../lib/utils";
import { Badge, Chips, ColBars, confirmDel, Empty, HBars, MonthNav, PageHeader, Progress, Stat } from "../components/ui.jsx";
import { LogForm, TimerBox } from "../components/TimeParts.jsx";

export default function TimeTracker() {
  const { data, remove } = useStore();
  const { timeLogs, courses, jobs, settings } = data;
  const [month, setMonth] = useState(monthOf(todayISO()));
  const [cat, setCat] = useState("");
  const [form, setForm] = useState(null);
  const logs = timeLogs.filter((l) => l.date.startsWith(month));
  const prev = timeLogs.filter((l) => l.date.startsWith(addMonths(month, -1)));
  const total = sum(logs, (l) => l.minutes);
  const prevTotal = sum(prev, (l) => l.minutes);
  const activeDays = new Set(logs.map((l) => l.date)).size;
  const byCat = groupSum(logs, (l) => l.category, (l) => l.minutes);
  const daily = monthDays(month).map((d) => ({ label: d.slice(8), value: sum(logs.filter((l) => l.date === d), (l) => l.minutes) / 60, title: `${fmtDate(d)}: ${fmtMin(sum(logs.filter((l) => l.date === d), (l) => l.minutes))}` }));
  const weeks = [...new Set(monthDays(month).map(mondayOf))];
  const weekly = weeks.map((w) => ({ label: fmtDate(w).slice(0, 5), value: sum(logs.filter((l) => weekDates(w).includes(l.date)), (l) => l.minutes) / 60 }));
  const byCourse = groupSum(logs.filter((l) => l.courseId), (l) => courses.find((c) => c.id === l.courseId)?.name || "?", (l) => l.minutes);

  const year = new Date().getFullYear();
  const used = workDaysUsed(timeLogs, year);
  const curWeekWork = sum(timeLogs.filter((l) => l.category === "work" && weekDates(todayISO()).includes(l.date)), (l) => l.minutes) / 60;
  const shown = logs.filter((l) => !cat || l.category === cat).sort(byDateDesc);
  const label = (l) => courses.find((c) => c.id === l.courseId)?.name || jobs.find((j) => j.id === l.jobId)?.company || "";

  return (
    <>
      <PageHeader title="Hours & stats" sub="Log class, study, work, projects and German; at the end of the month see where your time went.">
        <button className="btn primary" onClick={() => setForm({})}>＋ Log time</button>
      </PageHeader>
      <div className="card"><TimerBox /></div>

      <div className="row between gap-top" style={{ marginBottom: 12 }}><MonthNav month={month} onChange={setMonth} /></div>
      <div className="grid stats">
        <Stat label="Total" value={fmtMin(total)} sub={prevTotal ? `${total >= prevTotal ? "▲" : "▼"} ${Math.abs(Math.round(((total - prevTotal) / prevTotal) * 100))}% vs last month` : ""} />
        <Stat label="Active days" value={activeDays} sub={activeDays ? `avg ${fmtMin(total / activeDays)} per day` : ""} />
        {Object.entries(TIME_CATS).filter(([k]) => byCat.some(([c]) => c === k)).slice(0, 3).map(([k, v]) => (
          <Stat key={k} label={v.label} value={fmtMin(sum(logs.filter((l) => l.category === k), (l) => l.minutes))} />
        ))}
      </div>

      <div className="grid gap-top">
        <div className="card">
          <h2>By category</h2>
          <HBars data={byCat.map(([k, v]) => [TIME_CATS[k]?.label || k, v, TIME_CATS[k]?.color])} format={fmtMin} />
        </div>
        <div className="card">
          <h2>By course</h2>
          <HBars data={byCourse} format={fmtMin} />
        </div>
      </div>
      <div className="grid gap-top">
        <div className="card"><h2>Hours per day</h2><ColBars data={daily} height={110} /></div>
        <div className="card"><h2>Hours per week</h2><ColBars data={weekly} height={110} /></div>
      </div>

      <div className="card gap-top">
        <h2>Work & work permit</h2>
        <div className="hbar-top"><span>Work days this year ({year})</span><span className="num">{used} / {settings.workDaysLimit}</span></div>
        <Progress value={pct(used, settings.workDaysLimit)} over={used > settings.workDaysLimit} />
        <small className="muted">Each day up to 4 hours = half day, more = a full day. Check the limit with your Ausländerbehörde and change it in Settings.</small>
        <div className="hbar-top gap-top"><span>Work hours this week</span><span className="num">{curWeekWork.toFixed(1)} / {settings.workHoursWeekLimit}</span></div>
        <Progress value={pct(curWeekWork, settings.workHoursWeekLimit)} over={curWeekWork > settings.workHoursWeekLimit} />
      </div>

      <div className="card gap-top">
        <h2><span>Entries for {fmtDate(month + "-01").slice(3)}</span></h2>
        <Chips value={cat} onChange={setCat} options={Object.entries(TIME_CATS).map(([k, v]) => [k, v.label])} />
        {shown.length === 0 ? <Empty>No entries.</Empty> : shown.map((l) => (
          <div className="item" key={l.id} style={{ alignItems: "center" }}>
            <div className="item-main">
              <Badge color={TIME_CATS[l.category]?.color}>{TIME_CATS[l.category]?.label}</Badge> <span>{label(l)}</span>
              <div><small className="muted">{fmtDate(l.date)} {l.note && `· ${l.note}`}</small></div>
            </div>
            <strong className="num" title={fmtMin(l.minutes)}>{fmtHM(l.minutes)}</strong>
            <button className="btn ghost sm" onClick={() => setForm({ ...l, h: String(Math.floor(l.minutes / 60)), m: String(l.minutes % 60) })}>Edit</button>
            <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("timeLogs", l.id)}>✕</button>
          </div>
        ))}
      </div>
      {form && <LogForm initial={form} onClose={() => setForm(null)} />}
    </>
  );
}
