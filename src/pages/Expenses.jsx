import { useMemo, useState } from "react";
import { useStore } from "../store.jsx";
import { FUTURE_TEMPLATES, RECURRING } from "../lib/constants";
import { payName, payOptions } from "../lib/pay";
import { addDays, addMonths, byDateDesc, expandFuture, fmtDate, groupSum, monthDays, monthLabel, monthOf, nextDue, num, receiptTotal, relDay, sum, todayISO, daysUntil } from "../lib/utils";
import { Badge, Chips, ColBars, confirmDel, Empty, Field, HBars, Modal, Money, MonthNav, PageHeader, Progress, Stat, Tabs } from "../components/ui.jsx";
import ReceiptForm from "../components/ReceiptForm.jsx";
import IncomeForm from "../components/IncomeForm.jsx";

export default function Expenses() {
  const [tab, setTab] = useState("receipts");
  return (
    <>
      <PageHeader title="Expenses & income" sub="Log every purchase right away; at month end, check the report and the unrecorded gap." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[["receipts", "🧾 Receipts"], ["future", "📅 Upcoming costs"], ["income", "💰 Income"], ["report", "📊 Report & budget"], ["balance", "🏦 Balance"]]}
      />
      {tab === "receipts" && <Receipts />}
      {tab === "future" && <Future />}
      {tab === "income" && <Income />}
      {tab === "report" && <Report />}
      {tab === "balance" && <Balance />}
    </>
  );
}

/* ───────────── receipts ───────────── */
function Receipts() {
  const { data, remove } = useStore();
  const { receipts, settings } = data;
  const [form, setForm] = useState(null);
  const [fl, setFl] = useState({ month: monthOf(todayISO()), category: "", store: "", pay: "", need: "", q: "", min: "", max: "" });
  const set = (p) => setFl((s) => ({ ...s, ...p }));

  const { rows, total, itemCount } = useMemo(() => {
    const q = fl.q.trim().toLowerCase();
    const out = [];
    receipts.forEach((r) => {
      if (fl.month && !r.date.startsWith(fl.month)) return;
      if (fl.store && r.store !== fl.store) return;
      if (fl.pay && r.paymentId !== fl.pay) return;
      if (q && !(`${r.store} ${r.note || ""} ${r.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(q))) return;
      const items = r.items.filter((i) => (!fl.category || i.category === fl.category) && (!fl.need || (fl.need === "need" ? i.need !== false : i.need === false)));
      if (!items.length) return;
      const t = sum(items, (i) => num(i.price));
      if (fl.min !== "" && t < num(fl.min)) return;
      if (fl.max !== "" && t > num(fl.max)) return;
      out.push({ r, items, t });
    });
    out.sort((a, b) => byDateDesc(a.r, b.r));
    return { rows: out, total: sum(out, (x) => x.t), itemCount: sum(out, (x) => x.items.length) };
  }, [receipts, fl]);

  const days = {};
  rows.forEach((x) => (days[x.r.date] = [...(days[x.r.date] || []), x]));
  const usedStores = [...new Set(receipts.map((r) => r.store))].sort();
  const active = fl.category || fl.store || fl.pay || fl.need || fl.q || fl.min || fl.max;

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="grid stats" style={{ flex: 1 }}>
          <Stat label={fl.month ? monthLabel(fl.month) : "All time"} value={<Money v={total} />} sub={`${rows.length} receipts · ${itemCount} items`} />
        </div>
        <button className="btn primary" onClick={() => setForm({})}>＋ New receipt</button>
      </div>

      <div className="card">
        <div className="filters">
          <Field label="Month">
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input type="month" value={fl.month} onChange={(e) => set({ month: e.target.value })} />
              {fl.month && <button className="btn sm" onClick={() => set({ month: "" })}>All</button>}
            </div>
          </Field>
          <Field label="Category"><select value={fl.category} onChange={(e) => set({ category: e.target.value })}><option value="">All</option>{settings.categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Store"><select value={fl.store} onChange={(e) => set({ store: e.target.value })}><option value="">All</option>{usedStores.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Payment"><select value={fl.pay} onChange={(e) => set({ pay: e.target.value })}><option value="">All</option>{payOptions(settings).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Need?"><select value={fl.need} onChange={(e) => set({ need: e.target.value })}><option value="">All</option><option value="need">Need</option><option value="want">Want</option></select></Field>
          <Field label="Search"><input value={fl.q} onChange={(e) => set({ q: e.target.value })} placeholder="Store, item, note" /></Field>
          <Field label="From €"><input inputMode="decimal" value={fl.min} onChange={(e) => set({ min: e.target.value })} /></Field>
          <Field label="To €"><input inputMode="decimal" value={fl.max} onChange={(e) => set({ max: e.target.value })} /></Field>
        </div>
        {active && <button className="btn sm" onClick={() => setFl((s) => ({ ...s, category: "", store: "", pay: "", need: "", q: "", min: "", max: "" }))}>Clear filters</button>}

        {rows.length === 0 ? (
          <Empty>{receipts.length ? "No receipts match these filters." : "No receipts yet. Log your first purchase."}</Empty>
        ) : (
          Object.entries(days).map(([d, list]) => (
            <div key={d}>
              <div className="day-head"><span>{fmtDate(d)} · {relDay(d)}</span><Money v={sum(list, (x) => x.t)} /></div>
              {list.map(({ r, items, t }) => (
                <div className="item" key={r.id}>
                  <div className="item-main">
                    <strong>{r.store} <Badge>{payName(settings, r.paymentId)}</Badge></strong>
                    <div className="tags">
                      {items.map((i) => (
                        <Badge key={i.id}>{i.name || "—"} · {num(i.price).toFixed(2)}€ · {i.category}{i.need === false ? " · Want" : ""}</Badge>
                      ))}
                    </div>
                    {r.note && <small className="muted">📝 {r.note}</small>}
                    {r.returnDeadline && <div><small className={daysUntil(r.returnDeadline) < 0 ? "muted" : "warn"}>↩️ Return deadline: {fmtDate(r.returnDeadline)} ({relDay(r.returnDeadline)})</small></div>}
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <strong><Money v={t} /></strong>
                    <div className="row" style={{ justifyContent: "flex-end" }}>
                      <button className="btn ghost sm" onClick={() => setForm(r)}>Edit</button>
                      <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("receipts", r.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      {form && <ReceiptForm initial={form} onClose={() => setForm(null)} />}
    </>
  );
}

/* ───────────── future expenses ───────────── */
function FutureForm({ initial, onClose }) {
  const { data, add, update } = useStore();
  const editing = initial?.id;
  const [f, setF] = useState({ title: "", amount: "", dueDate: todayISO(), category: data.settings.categories[0], recurring: "none", note: "", paid: false, ...initial });
  const set = (p) => setF((s) => ({ ...s, ...p }));
  function submit(e) {
    e.preventDefault();
    if (!f.title.trim()) return;
    const rec = { ...f, amount: num(f.amount) };
    editing ? update("future", f.id, rec) : add("future", rec);
    onClose();
  }
  return (
    <Modal title={editing ? "Edit upcoming cost" : "Upcoming cost"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-row">
          <Field label="Title *" grow={2}><input value={f.title} onChange={(e) => set({ title: e.target.value })} autoFocus required /></Field>
          <Field label="Amount €"><input inputMode="decimal" value={f.amount} onChange={(e) => set({ amount: e.target.value })} /></Field>
        </div>
        <div className="form-row">
          <Field label="Due date"><input type="date" value={f.dueDate} onChange={(e) => set({ dueDate: e.target.value })} required /></Field>
          <Field label="Repeats"><select value={f.recurring} onChange={(e) => set({ recurring: e.target.value })}>{Object.entries(RECURRING).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Category"><select value={f.category} onChange={(e) => set({ category: e.target.value })}>{data.settings.categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <Field label="Note"><input value={f.note} onChange={(e) => set({ note: e.target.value })} /></Field>
        <div className="row gap-top"><button className="btn primary">Save</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

function Future() {
  const { data, update, remove } = useStore();
  const [form, setForm] = useState(null);
  const [pay, setPay] = useState(null);
  const [show, setShow] = useState("open");
  const today = todayISO();
  const startM = monthOf(today);
  const horizon = `${addMonths(startM, 5)}-31`;
  const occ = useMemo(() => expandFuture(data.future, horizon), [data.future, horizon]);
  const months = Array.from({ length: 6 }, (_, i) => addMonths(startM, i));
  const perMonth = months.map((m) => ({ label: m.slice(5), value: sum(occ.filter((o) => o.dueDate.startsWith(m)), (o) => o.amount), title: `${monthLabel(m)}: ${sum(occ.filter((o) => o.dueDate.startsWith(m)), (o) => o.amount).toFixed(2)} €` }));
  const next30 = sum(occ.filter((o) => o.dueDate <= addDays(today, 30)), (o) => o.amount);
  const monthlyFixed = sum(data.future.filter((x) => !x.paid && x.recurring === "monthly"), (x) => x.amount);
  const list = [...data.future].filter((x) => (show === "open" ? !x.paid : show === "paid" ? x.paid : true)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  function afterPaid(x) {
    if (x.recurring && x.recurring !== "none") update("future", x.id, { dueDate: nextDue(x.dueDate, x.recurring) });
    else update("future", x.id, { paid: true });
  }

  return (
    <>
      <div className="grid stats">
        <Stat label="Next 30 days" value={<Money v={next30} />} tone={next30 > 0 ? "warn" : ""} />
        <Stat label="Fixed monthly costs" value={<Money v={monthlyFixed} />} />
        <Stat label="Unpaid" value={data.future.filter((x) => !x.paid).length} />
      </div>
      <div className="card gap-top">
        <h2>Next 6 months (including recurring)</h2>
        <ColBars data={perMonth} height={110} />
      </div>
      <div className="card gap-top">
        <h2>
          <span>Schedule</span>
          <button className="btn primary sm" onClick={() => setForm({})}>＋ Upcoming cost</button>
        </h2>
        <small className="muted">Quick-add from common German costs so nothing gets forgotten:</small>
        <div className="chips" style={{ margin: "6px 0 12px" }}>
          {FUTURE_TEMPLATES.map((t) => (
            <button key={t.title} className="chip" onClick={() => setForm({ ...t, dueDate: addDays(today, 7) })}>＋ {t.title}</button>
          ))}
        </div>
        <Chips all={null} value={show} onChange={(v) => setShow(v || "open")} options={[["open", "Awaiting payment"], ["paid", "Paid"], ["all", "All"]]} />
        {list.length === 0 ? <Empty>Nothing here.</Empty> : list.map((x) => {
          const d = daysUntil(x.dueDate);
          return (
            <div key={x.id} className={`item ${x.paid ? "done" : ""}`}>
              <div className="item-main">
                <strong>{x.title}</strong>
                <div className="tags">
                  <Badge>{x.category}</Badge>
                  <Badge>{RECURRING[x.recurring || "none"]}</Badge>
                  <Badge color={!x.paid && d < 0 ? "#dc2626" : !x.paid && d <= 7 ? "#d97706" : undefined}>{fmtDate(x.dueDate)} · {relDay(x.dueDate)}</Badge>
                </div>
                {x.note && <small className="muted">{x.note}</small>}
              </div>
              <div style={{ textAlign: "end" }}>
                <strong><Money v={x.amount} /></strong>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  {!x.paid && <button className="btn sm" onClick={() => setPay(x)}>✔ Mark paid</button>}
                  {x.paid && <button className="btn ghost sm" onClick={() => update("future", x.id, { paid: false })}>Undo</button>}
                  <button className="btn ghost sm" onClick={() => setForm(x)}>Edit</button>
                  <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("future", x.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {form && <FutureForm initial={form} onClose={() => setForm(null)} />}
      {pay && (
        <ReceiptForm
          initial={{ store: pay.title, date: today, items: [{ id: "p1", name: pay.title, price: String(pay.amount || ""), category: pay.category, need: true }] }}
          onClose={() => setPay(null)}
          onSaved={() => afterPaid(pay)}
        />
      )}
    </>
  );
}

/* ───────────── income ───────────── */
function Income() {
  const { data, remove } = useStore();
  const [form, setForm] = useState(null);
  const [month, setMonth] = useState(monthOf(todayISO()));
  const list = data.income.filter((x) => x.date.startsWith(month)).sort(byDateDesc);
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <MonthNav month={month} onChange={setMonth} />
        <button className="btn primary" onClick={() => setForm({})}>＋ Add income</button>
      </div>
      <div className="grid stats"><Stat label={`Income ${monthLabel(month)}`} value={<Money v={sum(list, (x) => x.amount)} />} tone="good" /></div>
      <div className="card gap-top">
        {list.length === 0 ? <Empty>No income logged this month.</Empty> : list.map((x) => (
          <div className="item" key={x.id}>
            <div className="item-main">
              <strong>{x.source}</strong>
              <div className="tags"><Badge>{x.type}</Badge><Badge>{fmtDate(x.date)}</Badge><Badge>{payName(data.settings, x.paymentId)}</Badge></div>
              {x.note && <small className="muted">{x.note}</small>}
            </div>
            <div style={{ textAlign: "end" }}>
              <strong className="good"><Money v={x.amount} /></strong>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button className="btn ghost sm" onClick={() => setForm(x)}>Edit</button>
                <button className="btn ghost sm danger" onClick={() => confirmDel() && remove("income", x.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {form && <IncomeForm initial={form} onClose={() => setForm(null)} />}
    </>
  );
}

/* ───────────── report & budget ───────────── */
function Report() {
  const { data } = useStore();
  const { settings, receipts, income } = data;
  const [month, setMonth] = useState(monthOf(todayISO()));
  const items = (m) => receipts.filter((r) => r.date.startsWith(m)).flatMap((r) => r.items.map((i) => ({ ...i, date: r.date, store: r.store, paymentId: r.paymentId, price: num(i.price) })));
  const cur = items(month);
  const prev = items(addMonths(month, -1));
  const total = sum(cur, (i) => i.price);
  const prevTotal = sum(prev, (i) => i.price);
  const inc = sum(income.filter((x) => x.date.startsWith(month)), (x) => x.amount);
  const budget = settings.monthlyBudget;
  const byCat = groupSum(cur, (i) => i.category, (i) => i.price);
  const needSum = sum(cur.filter((i) => i.need !== false), (i) => i.price);
  const daily = monthDays(month).map((d) => ({ label: d.slice(8), value: Math.max(0, sum(cur.filter((i) => i.date === d), (i) => i.price)) }));
  const delta = prevTotal ? ((total - prevTotal) / prevTotal) * 100 : null;

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}><MonthNav month={month} onChange={setMonth} /></div>
      <div className="grid stats">
        <Stat label="Total spent" value={<Money v={total} />} sub={delta === null ? "" : `${delta > 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(0)}% vs last month`} />
        <Stat label="Income" value={<Money v={inc} />} tone="good" />
        <Stat label="Income − spent" value={<Money v={inc - total} />} tone={inc - total < 0 ? "bad" : "good"} />
        {budget > 0 && <Stat label="Budget left" value={<Money v={budget - total} />} tone={budget - total < 0 ? "bad" : ""} sub={`of ${budget} €`} />}
      </div>
      {budget > 0 && <div className="card gap-top"><h2>Monthly budget</h2><Progress value={(total / budget) * 100} over={total > budget} /></div>}
      {budget === 0 && <div className="banner gap-top">Set a monthly budget in "Settings" to compare it here.</div>}
      <div className="grid gap-top">
        <div className="card">
          <h2>By category</h2>
          {byCat.length === 0 ? <Empty>No spending</Empty> : byCat.map(([c, v]) => {
            const cb = settings.categoryBudgets[c];
            return (
              <div key={c} style={{ marginBottom: 10 }}>
                <div className="hbar-top"><span>{c}</span><span className="num muted">{v.toFixed(2)} €{cb ? ` / ${cb} €` : ""}</span></div>
                <Progress value={cb ? (v / cb) * 100 : total ? (v / total) * 100 : 0} over={cb && v > cb} />
              </div>
            );
          })}
        </div>
        <div className="card">
          <h2>Stores (top spending)</h2>
          <HBars data={groupSum(cur, (i) => i.store, (i) => i.price).slice(0, 8)} total={total} />
        </div>
        <div className="card">
          <h2>Payment method</h2>
          <HBars data={groupSum(cur, (i) => payName(settings, i.paymentId), (i) => i.price)} total={total} />
        </div>
        <div className="card">
          <h2>Needs vs wants</h2>
          <HBars data={[["Need", needSum, "#16a34a"], ["Want", total - needSum, "#d97706"]].filter((d) => d[1] > 0)} total={total} />
        </div>
      </div>
      <div className="card gap-top"><h2>Daily spending</h2><ColBars data={daily} height={120} /></div>
    </>
  );
}

/* ───────────── balance & reconciliation ───────────── */
function Balance() {
  const { data, add, remove, setSettings } = useStore();
  const { settings, receipts, income, reconciliations } = data;
  const [actual, setActual] = useState("");
  const from = settings.openingDate || "0000-00-00";
  const spent = sum(receipts.filter((r) => r.date >= from), receiptTotal);
  const earned = sum(income.filter((x) => x.date >= from), (x) => x.amount);
  const est = settings.openingBalance + earned - spent;
  const gap = actual === "" ? null : num(actual) - est;
  const last = [...reconciliations].sort((a, b) => b.createdAt - a.createdAt);

  // how long will it last?
  const monthAvg = (() => {
    const today = todayISO();
    const start = addDays(today, -60);
    const s = sum(receipts.filter((r) => r.date >= start), receiptTotal);
    return s / 2;
  })();
  const fixedMonthly = sum(data.future.filter((x) => !x.paid && x.recurring === "monthly"), (x) => x.amount);

  return (
    <>
      <div className="grid stats">
        <Stat label="Estimated balance now" value={<Money v={est} />} tone={est < 0 ? "bad" : ""} sub={settings.openingDate ? `since ${fmtDate(settings.openingDate)}` : "since the start"} />
        <Stat label="Opening balance (Settings)" value={<Money v={settings.openingBalance} />} />
        <Stat label="Logged income" value={<Money v={earned} />} tone="good" />
        <Stat label="Logged spending" value={<Money v={spent} />} />
      </div>
      {monthAvg > 0 && (
        <div className="card gap-top">
          Average spending over the last 2 months: <strong><Money v={monthAvg} /></strong> per month
          {est > 0 && <> — at this rate your balance lasts about <strong>{(est / Math.max(monthAvg, fixedMonthly)).toFixed(1)}</strong> months (without new income).</>}
        </div>
      )}
      <div className="card gap-top">
        <h2>Reconcile with bank (find unrecorded spending)</h2>
        <p className="muted" style={{ marginTop: 0 }}>Enter the actual balance of your accounts and wallet now; the difference from the app estimate is spending or income you have not logged.</p>
        <div className="form-row">
          <Field label="Actual total balance (€)"><input inputMode="decimal" value={actual} onChange={(e) => setActual(e.target.value)} /></Field>
        </div>
        {gap !== null && (
          <p>
            {Math.abs(gap) < 0.01 ? <span className="good">✔ It matches exactly!</span> : gap < 0
              ? <span className="bad">You have about <Money v={-gap} /> of unrecorded spending.</span>
              : <span className="warn">You have about <Money v={gap} /> of unrecorded income or over-logged spending.</span>}
          </p>
        )}
        <div className="row">
          <button className="btn" disabled={gap === null} onClick={() => { add("reconciliations", { date: todayISO(), actual: num(actual), estimated: est, gap }); setActual(""); }}>Save to history</button>
          <button className="btn" disabled={gap === null} onClick={() => { if (confirmDel("Set this amount as the new opening balance?")) { setSettings({ openingBalance: num(actual), openingDate: todayISO() }); setActual(""); } }}>Set as new opening balance</button>
        </div>
      </div>
      {last.length > 0 && (
        <div className="card gap-top">
          <h2>Reconciliation history</h2>
          {last.map((r) => (
            <div key={r.id} className="item">
              <div className="item-main">{fmtDate(r.date)} — actual <Money v={r.actual} /> · estimated <Money v={r.estimated} /></div>
              <strong className={r.gap < 0 ? "bad" : "good"}><Money v={r.gap} /></strong>
              <button className="btn ghost sm danger" onClick={() => remove("reconciliations", r.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
