import { useState } from "react";
import { useStore } from "../store.jsx";
import { fmtDate, num, sum, todayISO } from "../lib/utils";
import { Badge, confirmDel, Empty, Field, Modal, Money, PageHeader, Stat } from "../components/ui.jsx";

const directionLabel = (direction) => direction === "borrowed" ? "Borrowed" : "Lent";
const personKey = (name) => name.trim().toLowerCase();

export default function Debts() {
  const { data, add, update, remove, setKey } = useStore();
  const [form, setForm] = useState(null);
  const [newPerson, setNewPerson] = useState(null);
  const [personError, setPersonError] = useState("");
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const people = new Map();
  for (const name of [...data.debtPeople, ...data.debts.map((debt) => debt.person)]) {
    const key = personKey(name);
    if (key && !people.has(key)) people.set(key, { name: name.trim(), balance: 0 });
  }
  for (const debt of data.debts) {
    const person = people.get(personKey(debt.person));
    if (debt.settled || !person) continue;
    const cents = Math.round(num(debt.amount) * 100);
    person.balance += debt.direction === "lent" ? cents : -cents;
  }
  const peopleList = [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
  const list = data.debts.filter((debt) =>
    (!direction || debt.direction === direction) &&
    (!status || (status === "settled" ? debt.settled : !debt.settled)) &&
    `${debt.person} ${debt.note}`.toLowerCase().includes(search.trim().toLowerCase())
  ).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const open = (debt) => { setError(""); setForm(debt); };
  const set = (patch) => setForm((previous) => ({ ...previous, ...patch }));
  const openEntry = (person = "") => open({ direction: "borrowed", person, date: todayISO(), amount: "", note: "", settled: false });

  function savePerson(event) {
    event.preventDefault();
    const name = newPerson.trim();
    if (!name) return;
    if (people.has(personKey(name))) {
      setPersonError("This person is already on the list.");
      return;
    }
    setKey("debtPeople", (previous) => [...previous, name]);
    setNewPerson(null);
  }

  function save(event) {
    event.preventDefault();
    const raw = String(form.amount).trim().replace(",", ".");
    const amount = Math.round(Number(raw) * 100) / 100;
    if (!/^\d+(\.\d{1,2})?$/.test(raw) || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a positive amount with up to two decimal places.");
      return;
    }
    if (!form.person.trim() || !form.date) return;
    const debt = { ...form, person: form.person.trim(), amount, note: form.note.trim() };
    setKey("debtPeople", (previous) => previous.some((name) => personKey(name) === personKey(debt.person))
      ? previous : [...previous, debt.person]);
    if (form.id) update("debts", form.id, debt);
    else add("debts", debt);
    setForm(null);
  }

  return (
    <>
      <PageHeader title="Debts & loans" sub="Track money you borrowed or lent and mark it as settled when repaid.">
        <button className="btn" onClick={() => { setPersonError(""); setNewPerson(""); }}>＋ Add person</button>
        <button className="btn primary" disabled={!peopleList.length} onClick={() => openEntry()}>＋ New entry</button>
      </PageHeader>
      <div className="grid stats">
        <Stat label="I owe" value={<Money v={sum(peopleList, ({ balance }) => Math.max(-balance, 0)) / 100} />} />
        <Stat label="Owed to me" value={<Money v={sum(peopleList, ({ balance }) => Math.max(balance, 0)) / 100} />} />
      </div>
      <h2 className="gap-top">Balances by person</h2>
      {!peopleList.length && <Empty>Add a person to start tracking their balance.</Empty>}
      <div className="grid gap-top">
        {peopleList.map(({ name, balance }) => (
          <div className="card debt-card" key={personKey(name)}>
            <h2>{name}</h2>
            {balance === 0 ? <span className="muted">No outstanding balance</span> : (
              <div>{balance < 0 ? "I owe" : "Owed to me"} · <Money v={Math.abs(balance) / 100} /></div>
            )}
            <button className="btn sm gap-top" onClick={() => openEntry(name)}>＋ New entry</button>
          </div>
        ))}
      </div>
      <h2 className="gap-top">Entry history</h2>
      <div className="filters gap-top">
        <Field label="Search person or note"><input value={search} onChange={(event) => setSearch(event.target.value)} /></Field>
        <Field label="Type"><select value={direction} onChange={(event) => setDirection(event.target.value)}><option value="">All</option><option value="borrowed">Borrowed</option><option value="lent">Lent</option></select></Field>
        <Field label="Status"><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option><option value="outstanding">Outstanding</option><option value="settled">Settled</option></select></Field>
      </div>
      <div className="grid">
        {list.length === 0 && <Empty>No entries found. Add money you borrowed or lent.</Empty>}
        {list.map((debt) => (
          <div className="card debt-card" key={debt.id}>
            <h2><span>{debt.person}</span><Money v={debt.amount} /></h2>
            <div className="tags"><Badge>{directionLabel(debt.direction)}</Badge><Badge>{debt.settled ? "Settled" : "Outstanding"}</Badge></div>
            <div className="muted">{debt.direction === "borrowed" ? "Borrowed from" : "Lent to"} {debt.person} · {fmtDate(debt.date)}</div>
            {debt.note && <p className="muted debt-note">{debt.note}</p>}
            <div className="row gap-top">
              <button className="btn sm" onClick={() => update("debts", debt.id, { settled: !debt.settled })}>{debt.settled ? "Mark outstanding" : "Mark settled"}</button>
              <button className="btn sm" onClick={() => open({ ...debt, person: people.get(personKey(debt.person))?.name || "", amount: String(debt.amount) })}>Edit</button>
              <button className="btn sm danger" onClick={() => confirmDel("Delete this debt or loan entry?") && remove("debts", debt.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {form && <Modal title={form.id ? "Edit entry" : "New debt or loan"} onClose={() => setForm(null)}>
        <form className="debt-form" onSubmit={save}>
          <Field label="Type"><select value={form.direction} onChange={(event) => set({ direction: event.target.value })}><option value="borrowed">I borrowed money</option><option value="lent">I lent money</option></select></Field>
          <Field label={form.direction === "borrowed" ? "Borrowed from *" : "Lent to *"}>
            <select autoFocus required value={form.person} onChange={(event) => set({ person: event.target.value })}>
              <option value="" disabled>Select a person</option>
              {peopleList.map(({ name }) => <option key={name} value={name}>{name}</option>)}
            </select>
          </Field>
          <Field label="Date *"><input type="date" required value={form.date} onChange={(event) => set({ date: event.target.value })} /></Field>
          <Field label="Amount (€) *"><input inputMode="decimal" required value={form.amount} onChange={(event) => { set({ amount: event.target.value }); setError(""); }} placeholder="0.00" /></Field>
          {error && <div className="bad" role="alert">{error}</div>}
          <Field label="Note (optional)"><textarea value={form.note} onChange={(event) => set({ note: event.target.value })} /></Field>
          <label className="check"><input type="checkbox" checked={form.settled} onChange={(event) => set({ settled: event.target.checked })} /> Settled (fully repaid)</label>
          <div className="row"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      </Modal>}
      {newPerson !== null && <Modal title="Add person" onClose={() => setNewPerson(null)}>
        <form className="debt-form" onSubmit={savePerson}>
          <Field label="Name *"><input autoFocus required value={newPerson} onChange={(event) => { setNewPerson(event.target.value); setPersonError(""); }} /></Field>
          {personError && <div className="bad" role="alert">{personError}</div>}
          <div className="row"><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setNewPerson(null)}>Cancel</button></div>
        </form>
      </Modal>}
    </>
  );
}
