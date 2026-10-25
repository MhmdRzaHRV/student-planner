import { TASK_COLORS } from "./constants";
import { addMonths, expandFuture, monthOf, todayISO } from "./utils";

// Everything that has a date, in one list — used by the calendar and the dashboard.
export function buildEvents(data) {
  const ev = [];
  const push = (e) => e.date && ev.push(e);
  data.tasks.forEach((t) => {
    push({ date: t.date, time: t.time, label: t.title, color: TASK_COLORS[t.type] || "#64748b", done: t.done, src: "tasks", taskId: t.id });
    (t.followups || []).forEach((f) => push({ date: f.date, label: `Follow-up: ${t.title}${f.note ? ` (${f.note})` : ""}`, color: "#7c3aed", done: f.done || t.done, src: "followups", taskId: t.id }));
  });
  data.letters.forEach((l) => l.status !== "done" && push({ date: l.deadline, label: `Letter deadline: ${l.subject}`, color: "#dc2626", src: "letters" }));
  data.exams.forEach((x) => {
    push({ date: x.date, time: x.time, label: `Exam: ${x.title}`, color: "#be123c", src: "exams" });
    if (!x.registered) push({ date: x.registerDeadline, label: `Exam registration deadline: ${x.title}`, color: "#dc2626", src: "exams" });
  });
  data.projects.filter((p) => p.status !== "submitted").forEach((p) => push({ date: p.deadline, label: `Project deadline: ${p.title}`, color: "#0891b2", src: "projects" }));
  data.leisure.filter((l) => !l.done).forEach((l) => push({ date: l.plannedDate, label: `Leisure: ${l.title}`, color: "#c026d3", src: "leisure" }));
  data.jobs.filter((j) => j.stage !== "current" && j.active !== false).forEach((j) => push({ date: j.followDate, label: `Job follow-up: ${j.company}`, color: "#d97706", src: "jobs" }));
  const horizon = `${addMonths(monthOf(todayISO()), 12)}-31`;
  expandFuture(data.future, horizon).forEach((f) => push({ date: f.dueDate, label: `Payment: ${f.title}${f.amount ? ` (${f.amount}€)` : ""}`, color: "#16a34a", src: "future" }));
  return ev;
}
export const EVENT_SOURCES = {
  tasks: "Tasks", followups: "Follow-ups", letters: "Letter deadlines", exams: "Exams", projects: "Projects", future: "Payments", leisure: "Leisure", jobs: "Jobs",
};
