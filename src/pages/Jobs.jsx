import { useState } from "react";
import { useStore } from "../store.jsx";
import { JOB_STATUS, JOB_TYPES } from "../lib/constants";
import { fmtDate, fmtMin, mapsUrl, monthOf, num, relDay, sum, todayISO, daysUntil } from "../lib/utils";
import { Badge, Chips, confirmDel, Empty, Field, Modal, Money, PageHeader, Stat, Tabs } from "../components/ui.jsx";
import IncomeForm from "../components/IncomeForm.jsx";

const blank = { company: "", position: "", jobType: JOB_TYPES[0], status: "searching", contactPerson: "", phone: "", email: "", address: "", link: "", salary: "", salaryUnit: "€/hour", appliedDate: "", followDate: "", hoursWeek: "", startDate: "", note: "", stage: "search", active: true };

function JobForm({ initial, onClose }) {
  const { data, add, update } = useStore();
  const editing = data.jobs.some((j) => j.id === initial.id);
  const [f, setF] = useState({ ...blank, ...initial });
  const set = (p) => setF((s) => ({ ...s, ...p }));
  const current = f.stage === "current";
  function submit(e) {
    e.preventDefault();
    if (!f.company.trim()) return;
    editing ? update("jobs", f.id, f) : add("jobs", f);
    onClose();
  }
  return (
    <Modal title={current ? "Current job" : editing ? "Edit" : "New job lead"} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="form-row">
          <Field label="Company / employer *" grow={2}><input value={f.company} onChange={(e) => set({ company: e.target.value })} autoFocus required /></Field>
          <Field label="Position" grow={2}><input value={f.position} onChange={(e) => set({ position: e.target.value })} /></Field>
          <Field label="Type"><select value={f.jobType} onChange={(e) => set({ jobType: e.target.value })}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="form-row">
          <Field label="Contact person"><input value={f.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} /></Field>
          <Field label="Phone"><input type="tel" dir="ltr" value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Email"><input type="email" dir="ltr" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        </div>
        <div className="form-row">
          <Field label="Address / location" grow={2}><input value={f.address} onChange={(e) => set({ address: e.target.value })} /></Field>
          <Field label="Job posting link" grow={2}><input type="url" dir="ltr" value={f.link} onChange={(e) => set({ link: e.target.value })} /></Field>
        </div>
        <div className="form-row">
          <Field label="Pay"><input inputMode="decimal" value={f.salary} onChange={(e) => set({ salary: e.target.value })} /></Field>
          <Field label="Unit"><select value={f.salaryUnit} onChange={(e) => set({ salaryUnit: e.target.value })}><option>€/hour</option><option>€/month</option></select></Field>
          <Field label="Hours per week"><input inputMode="decimal" value={f.hoursWeek} onChange={(e) => set({ hoursWeek: e.target.value })} /></Field>
          {current ? (
            <Field label="Start date"><input type="date" value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
          ) : (
            <>
              <Field label="Status"><select value={f.status} onChange={(e) => set({ status: e.target.value })}>{Object.entries(JOB_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
              <Field label="Application date"><input type="date" value={f.appliedDate} onChange={(e) => set({ appliedDate: e.target.value })} /></Field>
              <Field label="Next follow-up"><input type="date" value={f.followDate} onChange={(e) => set({ followDate: e.target.value })} /></Field>
            </>
          )}
        </div>
        <Field label="Note"><textarea value={f.note} onChange={(e) => set({ note: e.target.value })} /></Field>
        <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

function Contactline({ j }) {
  return (
    <div className="tags">
      {j.contactPerson && <Badge>👤 {j.contactPerson}</Badge>}
      {j.phone && <a className="badge" href={`tel:${j.phone}`}>📞 <span className="num">{j.phone}</span></a>}
      {j.email && <a className="badge" href={`mailto:${j.email}`}>✉️ {j.email}</a>}
      {j.address && <a className="badge" href={mapsUrl(j.address)} target="_blank" rel="noreferrer">📍 {j.address}</a>}
      {j.link && <a className="badge" href={j.link} target="_blank" rel="noreferrer">🔗 Posting</a>}
    </div>
  );
}

export default function Jobs() {
  const { data, update, remove } = useStore();
  const [tab, setTab] = useState("search");
  const [form, setForm] = useState(null);
  const [income, setIncome] = useState(null);
  const [status, setStatus] = useState("");
  const [convert, setConvert] = useState(null);
  const month = monthOf(todayISO());
  const search = data.jobs.filter((j) => j.stage !== "current");
  const act = search.filter((j) => j.active !== false && (!status || j.status === status));
  const arch = search.filter((j) => j.active === false);
  const cur = data.jobs.filter((j) => j.stage === "current");

  const jobMin = (j) => sum(data.timeLogs.filter((l) => l.category === "work" && l.jobId === j.id && l.date.startsWith(month)), (l) => l.minutes);
  const estPay = (j) => (j.salaryUnit === "€/month" ? num(j.salary) : (jobMin(j) / 60) * num(j.salary));

  return (
    <>
      <PageHeader title="Jobs & applications" sub="Track leads; once you get a job, convert it to a current job and log its income.">
        <button className="btn primary" onClick={() => setForm({ ...blank })}>＋ Job lead</button>
      </PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[["search", `🔎 Searching (${search.filter((j) => j.active !== false).length})`], ["current", `💼 Current jobs (${cur.length})`], ["archive", `🗄️ Archive (${arch.length})`]]} />

      {tab === "search" && (
        <>
          <Chips value={status} onChange={setStatus} options={Object.entries(JOB_STATUS)} />
          <div className="card gap-top">
            {act.length === 0 ? <Empty>Nothing here. Add your first job lead.</Empty> : act.map((j) => (
              <div className="item" key={j.id}>
                <div className="item-main">
                  <strong>{j.company} {j.position && <span className="muted">— {j.position}</span>}</strong>
                  <div className="tags">
                    <Badge>{j.jobType}</Badge><Badge color="#2563eb">{JOB_STATUS[j.status]}</Badge>
                    {j.salary && <Badge>{j.salary} {j.salaryUnit}</Badge>}
                    {j.appliedDate && <Badge>Applied: {fmtDate(j.appliedDate)}</Badge>}
                    {j.followDate && <Badge color={daysUntil(j.followDate) <= 0 ? "#dc2626" : "#d97706"}>Follow-up: {fmtDate(j.followDate)} ({relDay(j.followDate)})</Badge>}
                  </div>
                  <Contactline j={j} />
                  {j.note && <small className="muted">{j.note}</small>}
                </div>
                <div className="row" style={{ flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <button className="btn sm primary" onClick={() => setConvert({ ...j, stage: "current", status: "accepted", startDate: todayISO() })}>🎉 Got the job</button>
                  <button className="btn ghost sm" onClick={() => setForm(j)}>Edit</button>
                  <button className="btn ghost sm" onClick={() => update("jobs", j.id, { active: false })}>Deactivate</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "current" && (
        cur.length === 0 ? <Empty>No current jobs yet. Use "Got the job" in the Searching tab to add one.</Empty> :
        <div className="grid">
          {cur.map((j) => (
            <div className="card" key={j.id} style={{ opacity: j.active === false ? 0.6 : 1 }}>
              <h2><span>{j.company}</span><Badge>{j.jobType}</Badge></h2>
              <div className="muted">{j.position}{j.startDate && ` · since ${fmtDate(j.startDate)}`}</div>
              <Contactline j={j} />
              <div className="grid stats gap-top">
                <Stat label="This month" value={fmtMin(jobMin(j))} />
                <Stat label="Estimated income" value={<Money v={estPay(j)} />} sub={`${j.salary || "?"} ${j.salaryUnit}`} />
              </div>
              <div className="row gap-top">
                <button className="btn primary sm" onClick={() => setIncome({ source: j.company, type: "Salary / work", jobId: j.id, amount: estPay(j) ? estPay(j).toFixed(2).replace(".", ",") : "" })}>💰 Log income</button>
                <button className="btn sm" onClick={() => setForm(j)}>Edit</button>
                <button className="btn sm" onClick={() => update("jobs", j.id, { active: j.active === false })}>{j.active === false ? "Reactivate" : "End job"}</button>
                <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("jobs", j.id)}>Delete</button>
              </div>
              <small className="muted">Log work hours in "Hours & stats" with the Work category and select this job.</small>
            </div>
          ))}
        </div>
      )}

      {tab === "archive" && (
        <div className="card">
          {arch.length === 0 ? <Empty>The archive is empty.</Empty> : arch.map((j) => (
            <div className="item" key={j.id}>
              <div className="item-main"><strong>{j.company}</strong><span className="muted"> {j.position}</span><Contactline j={j} /></div>
              <button className="btn sm" onClick={() => update("jobs", j.id, { active: true })}>Reactivate</button>
              <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("jobs", j.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {form && <JobForm initial={form} onClose={() => setForm(null)} />}
      {convert && <JobForm initial={convert} onClose={() => setConvert(null)} />}
      {income && <IncomeForm initial={income} onClose={() => setIncome(null)} />}
    </>
  );
}
