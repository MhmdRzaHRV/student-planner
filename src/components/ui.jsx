import { useEffect } from "react";
import { addMonths, fmtEUR, monthLabel } from "../lib/utils";

export const confirmDel = (msg = "Delete this item?") => window.confirm(msg);

export function PageHeader({ title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      <div className="row">{children}</div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export const Field = ({ label, children, grow }) => (
  <label className="field" style={grow ? { flex: grow } : undefined}>
    <span>{label}</span>
    {children}
  </label>
);

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={value === k} className={value === k ? "on" : ""} onClick={() => onChange(k)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Chips({ options, value, onChange, all = "All" }) {
  return (
    <div className="chips">
      {all !== null && (
        <button className={`chip ${value === "" ? "on" : ""}`} onClick={() => onChange("")}>{all}</button>
      )}
      {options.map(([k, l]) => (
        <button key={k} className={`chip ${value === k ? "on" : ""}`} onClick={() => onChange(value === k ? "" : k)}>{l}</button>
      ))}
    </div>
  );
}

export const Progress = ({ value, color, over }) => (
  <div className="progress">
    <div style={{ width: `${Math.min(100, value)}%`, background: over ? "var(--bad)" : color || "var(--accent)" }} />
  </div>
);

export function Stars({ value = 0, onChange }) {
  return (
    <span className="stars" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} className={n <= value ? "on" : ""} onClick={() => onChange && onChange(n === value ? 0 : n)} aria-label={`${n} stars`}>
          ★
        </button>
      ))}
    </span>
  );
}

export const Money = ({ v, cls = "" }) => <span className={`num ${cls}`}>{fmtEUR(v)}</span>;

// Horizontal bar chart; data: [[label, value, color?], ...]
export function HBars({ data, format = fmtEUR, total }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  const all = total ?? data.reduce((s, d) => s + d[1], 0);
  if (!data.length) return <Empty>No data</Empty>;
  return (
    <div className="hbars">
      {data.map(([label, v, color]) => (
        <div className="hbar" key={label}>
          <div className="hbar-top">
            <span>{label}</span>
            <span className="num muted">{format(v)}{all ? ` · ${Math.round((v / all) * 100)}%` : ""}</span>
          </div>
          <Progress value={(v / max) * 100} color={color} />
        </div>
      ))}
    </div>
  );
}

// Column chart; data: [{label, value, color?, title?}]
export function ColBars({ data, height = 100, goal }) {
  const max = Math.max(1, goal || 0, ...data.map((d) => d.value));
  return (
    <div className="colbars" style={{ height }} dir="ltr">
      {data.map((d, i) => (
        <div className="colbar" key={i} title={d.title || `${d.label}: ${Math.round(d.value)}`}>
          <div className="track">
            <div className="colbar-fill" style={{ height: `${(d.value / max) * 100}%`, background: d.color || "var(--accent)" }} />
          </div>
          <small>{d.label}</small>
        </div>
      ))}
      {goal ? <div className="goal-line" style={{ bottom: `calc(16px + (100% - 16px) * ${goal / max})` }} /> : null}
    </div>
  );
}

export function MonthNav({ month, onChange }) {
  return (
    <div className="monthnav">
      <button className="btn ghost sm" onClick={() => onChange(addMonths(month, -1))} aria-label="Previous month">◀</button>
      <strong>{monthLabel(month)}</strong>
      <button className="btn ghost sm" onClick={() => onChange(addMonths(month, 1))} aria-label="Next month">▶</button>
    </div>
  );
}

export const Badge = ({ children, color }) => (
  <span className="badge" style={color ? { background: color + "22", color } : undefined}>{children}</span>
);

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat ${tone || ""}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      {sub && <small className="muted">{sub}</small>}
    </div>
  );
}

export const Datalist = ({ id, options }) => (
  <datalist id={id}>
    {[...new Set(options)].map((o) => (
      <option key={o} value={o} />
    ))}
  </datalist>
);

// Small German flag as inline SVG (flag emoji don't render on Windows)
export const Flag = () => (
  <span className="flag" role="img" aria-label="Germany">
    <svg viewBox="0 0 5 3" preserveAspectRatio="none"><rect width="5" height="1" fill="#000" /><rect y="1" width="5" height="1" fill="#dd0000" /><rect y="2" width="5" height="1" fill="#ffce00" /></svg>
  </span>
);
