import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadData, saveData } from "./lib/storage";
import { uid } from "./lib/utils";
import { EXPENSE_CATEGORIES, TASK_TYPES } from "./lib/constants";
import { migrateCategories } from "./lib/categoryMigration";

export const DEFAULTS = {
  settings: {
    theme: "system",
    banks: [], // [{id, name}] — the cash option is always available
    monthlyBudget: 0,
    categoryBudgets: {},
    openingBalance: 0,
    openingDate: "",
    workDaysLimit: 140, // check with your Ausländerbehörde
    workHoursWeekLimit: 20,
    germanGoalMin: 30,
    german: { level: "", target: "", examDate: "" },
    categories: EXPENSE_CATEGORIES,
    taskTypes: TASK_TYPES,
    dailyBudget: 0,
    firstSalary: 0, // expected first paycheck (used on the Future page)
  },
  receipts: [], income: [], future: [], reconciliations: [], debts: [],
  courses: [], slots: [], sessions: {}, projects: [], exams: [],
  tasks: [], timeLogs: [], timer: null,
  vocab: [], routines: [], routineChecks: {},
  contacts: [], letters: [], leisure: [], shopping: [], jobs: [],
  dreams: [], prizes: [], claims: [], // Future page + streak rewards
};

export function mergeDefaults(loaded) {
  const l = loaded || {};
  return migrateCategories({
    ...DEFAULTS,
    ...l,
    settings: { ...DEFAULTS.settings, ...l.settings, german: { ...DEFAULTS.settings.german, ...(l.settings?.german || {}) } },
  });
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => mergeDefaults(loadData()));
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveData(data));
  }, [data]);

  // theme
  useEffect(() => {
    const apply = () => {
      const t = data.settings.theme;
      const palette = ["slate", "carbon"].find((p) => t === p || t === `${p}-dark`);
      const dark = t === "dark" || t.endsWith("-dark") || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      if (palette) document.documentElement.dataset.palette = palette;
      else delete document.documentElement.dataset.palette;
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [data.settings.theme]);

  const actions = useMemo(
    () => ({
      add: (col, item) => {
        const full = { id: uid(), createdAt: Date.now(), ...item };
        setData((p) => ({ ...p, [col]: [...p[col], full] }));
        return full;
      },
      update: (col, id, patch) => setData((p) => ({ ...p, [col]: p[col].map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      remove: (col, id) => setData((p) => ({ ...p, [col]: p[col].filter((x) => x.id !== id) })),
      removeMany: (col, pred) => setData((p) => ({ ...p, [col]: p[col].filter((x) => !pred(x)) })),
      setKey: (key, value) => setData((p) => ({ ...p, [key]: typeof value === "function" ? value(p[key]) : value })),
      setSettings: (patch) => setData((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
      replaceAll: (obj) => setData(mergeDefaults(obj)),
    }),
    []
  );

  const value = useMemo(() => ({ data, saveFailed, ...actions }), [data, saveFailed, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
