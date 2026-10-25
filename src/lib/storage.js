// ─────────────────────────────────────────────────────────────
// Storage adapter. The whole app talks ONLY to this file.
// Today: localStorage (one device). Later (phone + laptop sync):
// replace load()/save() with calls to Firebase/Supabase/your API —
// nothing else in the app needs to change.
// ─────────────────────────────────────────────────────────────
const KEY = "student-planner-v1";

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false; // storage full / blocked
  }
}

export function clearData() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
