import { useRef, useState } from "react";
import { useStore } from "../store.jsx";
import { clearData } from "../lib/storage";
import { THEMES } from "../lib/constants";
import { CSV_SECTIONS, exportSection } from "../lib/csv";
import { download, num, todayISO, uid } from "../lib/utils";
import { confirmDel, Field, PageHeader } from "../components/ui.jsx";

function ListEditor({ items, onChange, placeholder }) {
  const [v, setV] = useState("");
  const addIt = () => { const t = v.trim(); if (t && !items.includes(t)) onChange([...items, t]); setV(""); };
  return (
    <>
      <div className="chips">{items.map((c) => <span key={c} className="chip">{c} <button type="button" className="btn ghost sm" style={{ padding: 0 }} onClick={() => onChange(items.filter((x) => x !== c))} aria-label={`Remove ${c}`}>✕</button></span>)}</div>
      <div className="row gap-top"><input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIt(); } }} style={{ flex: 1 }} /><button type="button" className="btn" onClick={addIt}>＋</button></div>
    </>
  );
}

export default function Settings() {
  const { data, setSettings, replaceAll } = useStore();
  const s = data.settings;
  const [bank, setBank] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  function importJSON(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        if (typeof obj !== "object" || !obj || !obj.settings) throw new Error("bad");
        if (confirmDel("Replace all current data with this file?")) { replaceAll(obj); setMsg("✔ Restored."); }
      } catch { setMsg("❌ Invalid file."); }
    };
    r.readAsText(file);
  }

  return (
    <>
      <PageHeader title="Settings & backup" sub="Set everything up your way." />
      <div className="grid">
        <div className="card">
          <h2>🎨 Appearance</h2>
          <Field label="Theme"><select value={s.theme} onChange={(e) => setSettings({ theme: e.target.value })}>{THEMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        </div>

        <div className="card">
          <h2>🏦 Payment methods</h2>
          <small className="muted">"Cash" is always available. Add your banks so they appear in the expense form.</small>
          {s.banks.map((b) => (
            <div className="row gap-top" key={b.id} style={{ flexWrap: "nowrap" }}>
              <input value={b.name} onChange={(e) => setSettings({ banks: s.banks.map((x) => (x.id === b.id ? { ...x, name: e.target.value } : x)) })} aria-label="Bank name" />
              <button className="btn ghost danger sm" onClick={() => confirmDel("Delete this bank? (Earlier receipts will show \"(deleted)\")") && setSettings({ banks: s.banks.filter((x) => x.id !== b.id) })}>✕</button>
            </div>
          ))}
          <form className="row gap-top" onSubmit={(e) => { e.preventDefault(); if (bank.trim()) { setSettings({ banks: [...s.banks, { id: uid(), name: bank.trim() }] }); setBank(""); } }}>
            <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="e.g. Sparkasse, N26, Commerzbank, PayPal" style={{ flex: 1 }} /><button className="btn primary">＋ Bank</button>
          </form>
        </div>

        <div className="card">
          <h2>💶 Budget & balance</h2>
          <div className="form-row">
            <Field label="Monthly budget (€)"><input inputMode="decimal" value={s.monthlyBudget || ""} onChange={(e) => setSettings({ monthlyBudget: num(e.target.value) })} /></Field>
            <Field label="Daily budget (€, optional)"><input inputMode="decimal" value={s.dailyBudget || ""} onChange={(e) => setSettings({ dailyBudget: num(e.target.value) })} placeholder="default: monthly ÷ days" /></Field>
          </div>
          <div className="form-row">
            <Field label="Starting balance (€)"><input inputMode="decimal" value={s.openingBalance || ""} onChange={(e) => setSettings({ openingBalance: num(e.target.value) })} /></Field>
            <Field label="As of date"><input type="date" value={s.openingDate} onChange={(e) => setSettings({ openingDate: e.target.value })} /></Field>
          </div>
          <small className="muted">Starting balance = total money in your accounts and wallet on the "As of date". Receipts and income after that date are counted.</small>
          <details className="gap-top"><summary>Budget per category (optional)</summary>
            {s.categories.map((c) => <div className="row gap-top" key={c}><span style={{ flex: 1 }}>{c}</span><input style={{ width: 110 }} inputMode="decimal" value={s.categoryBudgets[c] || ""} onChange={(e) => setSettings({ categoryBudgets: { ...s.categoryBudgets, [c]: num(e.target.value) } })} placeholder="€" aria-label={`Budget ${c}`} /></div>)}
          </details>
        </div>

        <div className="card">
          <h2>💼 Work & German</h2>
          <div className="form-row">
            <Field label="Work days limit per year"><input inputMode="numeric" value={s.workDaysLimit} onChange={(e) => setSettings({ workDaysLimit: num(e.target.value) })} /></Field>
            <Field label="Work hours limit per week"><input inputMode="numeric" value={s.workHoursWeekLimit} onChange={(e) => setSettings({ workHoursWeekLimit: num(e.target.value) })} /></Field>
            <Field label="German goal (minutes per day)"><input inputMode="numeric" value={s.germanGoalMin} onChange={(e) => setSettings({ germanGoalMin: num(e.target.value) })} /></Field>
          </div>
          <small className="muted">Check your work-permit limits with your Ausländerbehörde / university; these are only used for in-app warnings.</small>
        </div>

        <div className="card"><h2>🏷️ Expense categories</h2><ListEditor items={s.categories} onChange={(categories) => setSettings({ categories })} placeholder="New category" /></div>
        <div className="card"><h2>🗂️ Task types</h2><ListEditor items={s.taskTypes} onChange={(taskTypes) => setSettings({ taskTypes })} placeholder="New type" /></div>

        <div className="card">
          <h2>💾 Backup</h2>
          <p className="muted" style={{ marginTop: 0 }}>Your data is stored only in this browser. Export a JSON file regularly and keep it somewhere safe.</p>
          <div className="row">
            <button className="btn primary" onClick={() => download(`planner-backup-${todayISO()}.json`, JSON.stringify(data, null, 2))}>⬇️ Export JSON</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>⬆️ Restore from JSON</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJSON} />
          </div>
          {msg && <p>{msg}</p>}
          <h3 className="gap-top">Export to Excel (CSV)</h3>
          <small className="muted">Open the CSV file in Excel (the separator is ";" for German Excel).</small>
          <div className="chips gap-top">{Object.entries(CSV_SECTIONS).map(([k, l]) => <button key={k} className="chip" onClick={() => exportSection(k, data)}>⬇️ {l}</button>)}</div>
        </div>

        <div className="card">
          <h2>⚠️ Delete all data</h2>
          <button className="btn danger" onClick={() => { if (confirmDel("Delete all data permanently? Make a backup first!") && confirmDel("Are you sure?")) { clearData(); replaceAll({}); } }}>Erase everything</button>
        </div>
      </div>
    </>
  );
}
