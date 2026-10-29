import { useState } from "react";
import { useStore } from "../store.jsx";
import { payOptions, payName } from "../lib/pay";
import { addDays, byDateDesc, daysInMonth, fmtDate, groupSum, mondayOf, monthOf, num, receiptTotal, relDay, sum, todayISO, uid, weekDates, weekdayIdx } from "../lib/utils";
import { DAYS_SHORT } from "../lib/constants";
import { Badge, ColBars, confirmDel, Empty, Field, HBars, Money, PageHeader, Progress, Stat } from "../components/ui.jsx";
import ReceiptForm from "../components/ReceiptForm.jsx";

const totalOn = (receipts, d) => sum(receipts.filter((r) => r.date === d), receiptTotal);

export default function Daily() {
  const { data, add, remove } = useStore();
  const { settings, receipts } = data;
  const today = todayISO();
  const cats = settings.categories;
  const [date, setDate] = useState(today);
  const [f, setF] = useState({ amount: "", category: cats[0], paymentId: "cash", note: "" });
  const [edit, setEdit] = useState(null);

  const month = monthOf(date);
  const allowance = settings.dailyBudget > 0 ? settings.dailyBudget : settings.monthlyBudget > 0 ? settings.monthlyBudget / daysInMonth(month) : 0;
  const dayRows = receipts.filter((r) => r.date === date).sort(byDateDesc);
  const spent = sum(dayRows, receiptTotal);
  const week = weekDates(date);
  const weekTotal = sum(week, (d) => totalOn(receipts, d));
  const monthRows = receipts.filter((r) => r.date.startsWith(month));
  const monthTotal = sum(monthRows, receiptTotal);
  const daysWithSpend = new Set(monthRows.map((r) => r.date)).size;
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const byCat = groupSum(dayRows.flatMap((r) => r.items), (i) => i.category, (i) => num(i.price)).filter(([, v]) => v > 0);

  // most used categories in the last 30 days, for one-tap picking
  const since = addDays(today, -30);
  const frequent = groupSum(receipts.filter((r) => r.date >= since).flatMap((r) => r.items), (i) => i.category, () => 1).slice(0, 6).map(([c]) => c);

  function quickAdd(e) {
    e.preventDefault();
    const price = num(f.amount);
    if (!price) return;
    const label = f.note.trim() || f.category;
    add("receipts", {
      store: label, date, paymentId: f.paymentId, note: "", returnDeadline: "", quick: true,
      items: [{ id: uid(), name: label, price, category: f.category, need: true }],
    });
    setF({ ...f, amount: "", note: "" });
  }

  return (
    <>
      <PageHeader title="Daily spending" sub="Log what you spend, the moment you spend it. Everything also shows up in Expenses and the reports." />

      <div className="day-strip">
        {week.map((d) => (
          <button key={d} className={`${d === date ? "on" : ""} ${d === today ? "today" : ""}`} onClick={() => setDate(d)}>
            <span>{DAYS_SHORT[weekdayIdx(d)]}</span>
            <strong>{d.slice(8)}</strong>
            <small className="num">{totalOn(receipts, d) ? Math.round(totalOn(receipts, d)) + " €" : "·"}</small>
          </button>
        ))}
      </div>
      <div className="row between gap-top">
        <div className="row">
          <button className="btn sm" onClick={() => setDate(addDays(mondayOf(date), -7))}>◀ Previous week</button>
          <button className="btn sm" onClick={() => setDate(addDays(mondayOf(date), 7))}>Next week ▶</button>
          {date !== today && <button className="btn sm" onClick={() => setDate(today)}>Today</button>}
        </div>
        <strong>{fmtDate(date)} · {relDay(date)}</strong>
      </div>

      <form className="card quick-add gap-top" onSubmit={quickAdd}>
        <Field label="Amount (€)"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0,00" autoFocus /></Field>
        <Field label="What / where (optional)"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Döner, bus ticket" /></Field>
        <Field label="Category"><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Paid with"><select value={f.paymentId} onChange={(e) => setF({ ...f, paymentId: e.target.value })}>{payOptions(settings).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <button className="btn primary">＋ Add</button>
      </form>
      {frequent.length > 0 && (
        <div className="chips" style={{ marginTop: 8 }}>
          <small className="muted">Frequent:</small>
          {frequent.map((c) => <button key={c} type="button" className={`chip ${f.category === c ? "on" : ""}`} onClick={() => setF({ ...f, category: c })}>{c}</button>)}
        </div>
      )}

      <div className="grid stats gap-top">
        <Stat label={date === today ? "Spent today" : `Spent ${fmtDate(date)}`} value={<Money v={spent} />} sub={allowance ? `daily allowance ${allowance.toFixed(2)} €` : "Set a budget in Settings"} tone={allowance && spent > allowance ? "bad" : ""} />
        <Stat label="This week" value={<Money v={weekTotal} />} sub={`${fmtDate(week[0])} – ${fmtDate(week[6])}`} />
        <Stat label="This month" value={<Money v={monthTotal} />} sub={daysWithSpend ? `avg ${(monthTotal / daysWithSpend).toFixed(2)} € per spending day` : ""} />
      </div>
      {allowance > 0 && <div style={{ margin: "12px 0" }}><Progress value={(spent / allowance) * 100} over={spent > allowance} /></div>}

      <div className="grid gap-top">
        <div className="card">
          <h2>{date === today ? "Today" : fmtDate(date)}</h2>
          {dayRows.length === 0 ? <Empty>Nothing logged for this day.</Empty> : dayRows.map((r) => (
            <div className="item" key={r.id}>
              <div className="item-main">
                <strong>{r.store} <Badge>{payName(settings, r.paymentId)}</Badge></strong>
                <small className="muted">{r.items.map((i) => `${i.name} · ${i.category}`).slice(0, 3).join(" · ")}{r.items.length > 3 ? ` +${r.items.length - 3}` : ""}</small>
              </div>
              <strong><Money v={receiptTotal(r)} /></strong>
              <div className="actions">
                <button className="btn ghost sm" onClick={() => setEdit(r)}>Edit</button>
                <button className="btn ghost sm danger" onClick={() => confirmDel("Delete this entry?") && remove("receipts", r.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h2>By category</h2>
          <HBars data={byCat} />
        </div>
      </div>

      <div className="card">
        <h2>Last 14 days</h2>
        <ColBars
          height={110}
          goal={allowance || undefined}
          data={last14.map((d) => ({ label: d.slice(8), value: totalOn(receipts, d), title: `${fmtDate(d)}: ${totalOn(receipts, d).toFixed(2)} €`, color: allowance && totalOn(receipts, d) > allowance ? "var(--bad)" : undefined }))}
        />
      </div>

      {edit && <ReceiptForm initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
