import { useEffect, useState } from "react";
import { useStore } from "./store.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Shopping from "./pages/Shopping.jsx";
import Jobs from "./pages/Jobs.jsx";
import Timetable from "./pages/Timetable.jsx";
import TimeTracker from "./pages/TimeTracker.jsx";
import German from "./pages/German.jsx";
import Tasks from "./pages/Tasks.jsx";
import Letters from "./pages/Letters.jsx";
import Contacts from "./pages/Contacts.jsx";
import Leisure from "./pages/Leisure.jsx";
import Routine from "./pages/Routine.jsx";
import Settings from "./pages/Settings.jsx";

const NAV = [
  ["", [["dashboard", "🏠", "Today", Dashboard]]],
  ["Money", [["expenses", "💶", "Expenses & income", Expenses], ["shopping", "🛒", "Shopping list", Shopping], ["jobs", "💼", "Jobs", Jobs]]],
  ["Study", [["timetable", "📚", "Timetable", Timetable], ["time", "⏱️", "Hours & stats", TimeTracker], ["german", "🇩🇪", "German learning", German]]],
  ["Life", [["routine", "🔁", "Daily routine", Routine], ["tasks", "✅", "Tasks & calendar", Tasks], ["letters", "✉️", "Letters", Letters], ["contacts", "📇", "Contacts", Contacts], ["leisure", "🎡", "Leisure", Leisure]]],
  ["", [["settings", "⚙️", "Settings & backup", Settings]]],
];
const PAGES = Object.fromEntries(NAV.flatMap(([, items]) => items).map(([k, , , C]) => [k, C]));
const readHash = () => {
  const k = window.location.hash.replace(/^#\/?/, "");
  return PAGES[k] ? k : "dashboard";
};

export default function App() {
  const { saveFailed } = useStore();
  const [page, setPage] = useState(readHash);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setPage(readHash());
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  const go = (k) => {
    window.location.hash = `/${k}`;
    setOpen(false);
    window.scrollTo(0, 0);
  };
  const Page = PAGES[page];

  return (
    <div className="app">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">🎓 Student Planner</div>
        {NAV.map(([group, items], gi) => (
          <div key={gi}>
            {group && <div className="nav-group">{group}</div>}
            {items.map(([k, icon, label]) => (
              <button key={k} className={`nav-item ${page === k ? "on" : ""}`} onClick={() => go(k)}>
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        ))}
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="topbar">
          <button className="btn" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
          <strong>🎓 Student Planner</strong>
        </div>
        <main className="main">
          {saveFailed && <div className="banner">⚠️ Browser storage is full or blocked. Export a JSON backup from Settings.</div>}
          <Page go={go} />
        </main>
      </div>
    </div>
  );
}
