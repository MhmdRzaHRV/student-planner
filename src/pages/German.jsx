import { useState } from "react";
import { useStore } from "../store.jsx";
import { ARTICLES, DAYS_SHORT, GERMAN_SKILLS } from "../lib/constants";
import { addDays, byDateDesc, fmtDate, fmtMin, minutesOn, pct, sum, todayISO, weekDates } from "../lib/utils";
import { Badge, Chips, ColBars, confirmDel, Empty, Field, Modal, PageHeader, Progress, Stat } from "../components/ui.jsx";
import { TimerBox } from "../components/TimeParts.jsx";

export default function German() {
  const { data, add, update, remove, setSettings } = useStore();
  const { timeLogs, vocab, settings } = data;
  const today = todayISO();
  const goal = settings.germanGoalMin;
  const logs = timeLogs.filter((l) => l.category === "german");
  const todayMin = minutesOn(logs, today);
  const [skill, setSkill] = useState(GERMAN_SKILLS[0]);
  const [vf, setVf] = useState(null);
  const [vq, setVq] = useState("");
  const [vs, setVs] = useState("");
  const g = settings.german;

  let streak = 0;
  for (let d = minutesOn(logs, today) > 0 ? today : addDays(today, -1); minutesOn(logs, d) > 0; d = addDays(d, -1)) streak++;

  const week = weekDates(today).map((d, i) => ({ label: DAYS_SHORT[i], value: minutesOn(logs, d), color: minutesOn(logs, d) >= goal ? "var(--good)" : undefined }));
  const monthKey = today.slice(0, 7);
  const monthTotal = sum(logs.filter((l) => l.date.startsWith(monthKey)), (l) => l.minutes);
  const quick = (m) => add("timeLogs", { category: "german", date: today, minutes: m, courseId: "", jobId: "", note: skill });
  const recent = [...logs].sort(byDateDesc).slice(0, 8);
  const words = vocab.filter((v) => (!vs || (vs === "learned" ? v.learned : !v.learned)) && (!vq || `${v.word} ${v.meaning}`.toLowerCase().includes(vq.toLowerCase())));

  return (
    <>
      <PageHeader title="Learning German 🇩🇪" sub="Log your study time every day and collect vocabulary." />
      <div className="grid stats">
        <Stat label="Today" value={fmtMin(todayMin)} sub={`goal ${goal} min`} tone={todayMin >= goal ? "good" : ""} />
        <Stat label="Day streak 🔥" value={streak} />
        <Stat label="This month" value={fmtMin(monthTotal)} />
        <Stat label="Words" value={`${vocab.filter((v) => v.learned).length}/${vocab.length}`} sub="learned" />
      </div>
      <div className="card gap-top">
        <Progress value={pct(todayMin, goal)} color="var(--good)" />
        <div className="row gap-top">
          <select value={skill} onChange={(e) => setSkill(e.target.value)} style={{ width: 160 }} aria-label="Skill">{GERMAN_SKILLS.map((s) => <option key={s}>{s}</option>)}</select>
          {[15, 30, 45, 60, 90].map((m) => <button key={m} className="btn sm" onClick={() => quick(m)}>＋{m} min</button>)}
        </div>
        <div className="gap-top"><TimerBox lockCategory="german" /></div>
      </div>

      <div className="grid gap-top">
        <div className="card"><h2>This week (minutes)</h2><ColBars data={week} goal={goal} height={110} /></div>
        <div className="card">
          <h2>Level & goal</h2>
          <div className="form-row">
            <Field label="Current level"><input value={g.level} onChange={(e) => setSettings({ german: { ...g, level: e.target.value } })} placeholder="A1" /></Field>
            <Field label="Target exam"><input value={g.target} onChange={(e) => setSettings({ german: { ...g, target: e.target.value } })} placeholder="B1 / TestDaF" /></Field>
            <Field label="Exam date"><input type="date" value={g.examDate} onChange={(e) => setSettings({ german: { ...g, examDate: e.target.value } })} /></Field>
          </div>
          <div className="row"><Field label="Daily goal (minutes)"><input inputMode="numeric" value={goal} onChange={(e) => setSettings({ germanGoalMin: Number(e.target.value) || 0 })} /></Field></div>
          {recent.length > 0 && <><h3 className="gap-top">Recent entries</h3>{recent.map((l) => <div key={l.id} className="row between"><small>{fmtDate(l.date)} · {l.note}</small><span><b className="num">{l.minutes}</b> min <button className="btn ghost sm danger" onClick={() => remove("timeLogs", l.id)}>✕</button></span></div>)}</>}
        </div>
      </div>

      <div className="card gap-top">
        <h2><span>📖 Vocabulary</span><button className="btn primary sm" onClick={() => setVf({ article: "—", word: "", meaning: "", example: "", learned: false })}>＋ Word</button></h2>
        <div className="filters">
          <Field label="Search"><input value={vq} onChange={(e) => setVq(e.target.value)} /></Field>
          <Chips value={vs} onChange={setVs} options={[["new", "Learning"], ["learned", "Learned"]]} />
        </div>
        {words.length === 0 ? <Empty>No words.</Empty> : words.map((v) => (
          <div className={`item ${v.learned ? "done" : ""}`} key={v.id} style={{ alignItems: "center" }}>
            <input type="checkbox" checked={!!v.learned} onChange={() => update("vocab", v.id, { learned: !v.learned })} aria-label="Learned" />
            <div className="item-main"><strong dir="ltr" style={{ textAlign: "start" }}>{v.article && v.article !== "—" && <Badge>{v.article}</Badge>} {v.word}</strong><span>{v.meaning}</span>{v.example && <small className="muted" dir="ltr" style={{ textAlign: "start", display: "block" }}>{v.example}</small>}</div>
            <button className="btn ghost sm" onClick={() => setVf(v)}>Edit</button>
            <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("vocab", v.id)}>✕</button>
          </div>
        ))}
      </div>
      {vf && (
        <Modal title="Word" onClose={() => setVf(null)}>
          <form onSubmit={(e) => { e.preventDefault(); if (!vf.word.trim()) return; vf.id ? update("vocab", vf.id, vf) : add("vocab", vf); setVf(null); }}>
            <div className="form-row">
              <Field label="Artikel"><select value={vf.article} onChange={(e) => setVf({ ...vf, article: e.target.value })}>{ARTICLES.map((a) => <option key={a}>{a}</option>)}</select></Field>
              <Field label="German word *" grow={2}><input dir="ltr" value={vf.word} onChange={(e) => setVf({ ...vf, word: e.target.value })} autoFocus required /></Field>
            </div>
            <Field label="Meaning"><input value={vf.meaning} onChange={(e) => setVf({ ...vf, meaning: e.target.value })} /></Field>
            <Field label="Example sentence"><input dir="ltr" value={vf.example} onChange={(e) => setVf({ ...vf, example: e.target.value })} /></Field>
            <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setVf(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
