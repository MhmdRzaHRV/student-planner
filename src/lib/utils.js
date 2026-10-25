import { MONTHS } from "./constants";

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, "0");

// ── dates (always LOCAL time, never UTC — important in Germany around midnight) ──
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
export const todayISO = () => toISO(new Date());
export const addDays = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const weekdayIdx = (iso) => (parseISO(iso).getDay() + 6) % 7; // Monday = 0
export const mondayOf = (iso) => addDays(iso, -weekdayIdx(iso));
export const weekDates = (iso) => Array.from({ length: 7 }, (_, i) => addDays(mondayOf(iso), i));
export const monthOf = (iso) => iso.slice(0, 7);
export const addMonths = (key, n) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1, 12);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
export const daysInMonth = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};
export const monthDays = (key) => Array.from({ length: daysInMonth(key) }, (_, i) => `${key}-${pad(i + 1)}`);
export const fmtDate = (iso) => (iso ? iso.split("-").reverse().join(".") : "");
export const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000);
export const daysUntil = (iso) => diffDays(iso, todayISO());
export const relDay = (iso) => {
  const d = daysUntil(iso);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d > 0) return `in ${d} days`;
  return `${-d} days ago`;
};

// ── numbers ──
export const num = (s) => {
  if (typeof s === "number") return s;
  const n = parseFloat(String(s ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const eur = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtEUR = (n) => `${eur.format(n || 0)} €`;
export const fmtMin = (m) => {
  m = Math.round(m || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
};
export const fmtHM = (m) => `${Math.floor((m || 0) / 60)}:${pad(Math.round((m || 0) % 60))}`;
export const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

// ── collections ──
export const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + (f(x) || 0), 0);
export const groupSum = (arr, keyF, valF) => {
  const o = {};
  arr.forEach((x) => {
    const k = keyF(x);
    o[k] = (o[k] || 0) + valF(x);
  });
  return Object.entries(o).sort((a, b) => b[1] - a[1]);
};
export const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0);

// ── receipts & recurring expenses ──
export const receiptTotal = (r) => sum(r.items || [], (i) => num(i.price));
export const nextDue = (iso, rec) => {
  const d = parseISO(iso);
  const step = rec === "monthly" ? 1 : rec === "semester" ? 6 : rec === "yearly" ? 12 : 0;
  if (!step) return iso;
  d.setMonth(d.getMonth() + step);
  return toISO(d);
};
// all occurrences of unpaid future items between today and `horizon` ISO
export const expandFuture = (items, horizon) => {
  const out = [];
  items.forEach((it) => {
    if (it.paid || !it.dueDate) return;
    let d = it.dueDate;
    let guard = 0;
    while (d <= horizon && guard++ < 60) {
      out.push({ ...it, dueDate: d, _first: d === it.dueDate });
      if (it.recurring === "none" || !it.recurring) break;
      d = nextDue(d, it.recurring);
    }
  });
  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

// ── time logs ──
export const minutesOn = (logs, date, cat) => sum(logs.filter((l) => l.date === date && (!cat || l.category === cat)), (l) => l.minutes);
// German residence-permit style counting: ≤4h = half day, otherwise full day
export const workDaysUsed = (logs, year, halfMax = 240) => {
  const perDay = {};
  logs.filter((l) => l.category === "work" && l.date.startsWith(String(year))).forEach((l) => {
    perDay[l.date] = (perDay[l.date] || 0) + l.minutes;
  });
  return sum(Object.values(perDay), (m) => (m <= halfMax ? 0.5 : 1));
};

// ── files ──
export function download(name, content, mime = "application/json") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
