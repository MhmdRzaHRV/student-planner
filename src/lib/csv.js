import { download, receiptTotal } from "./utils";

// Excel in Germany expects ";" as separator and "," as decimal mark. UTF-8 BOM keeps special characters intact.
const cell = (v) => {
  if (typeof v === "number") return String(v).replace(".", ",");
  const s = String(v ?? "").replace(/"/g, '""');
  return /[;"\n\r]/.test(s) ? `"${s}"` : s;
};
export function downloadCSV(name, rows) {
  const text = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  download(`${name}.csv`, text, "text/csv");
}

export function exportSection(key, data) {
  const pay = (id) => (id === "cash" ? "Cash" : data.settings.banks.find((b) => b.id === id)?.name || "");
  const course = (id) => data.courses.find((c) => c.id === id)?.name || "";
  const tables = {
    receipts: () => [
      ["Date", "Store", "Payment", "Item", "Category", "Price", "Needed", "Receipt total", "Note"],
      ...data.receipts.flatMap((r) =>
        r.items.map((i) => [r.date, r.store, pay(r.paymentId), i.name, i.category, Number(String(i.price).replace(",", ".")) || 0, i.need === false ? "No" : "Yes", receiptTotal(r), r.note || ""])
      ),
    ],
    income: () => [["Date", "Source", "Type", "Amount", "Account", "Note"], ...data.income.map((x) => [x.date, x.source, x.type, x.amount, pay(x.paymentId), x.note || ""])],
    future: () => [["Title", "Due date", "Amount", "Category", "Repeat", "Paid"], ...data.future.map((x) => [x.title, x.dueDate, x.amount, x.category, x.recurring, x.paid ? "Yes" : "No"])],
    tasks: () => [
      ["Title", "Type", "Date", "Time", "Done", "Contact", "Case number", "Description", "Result"],
      ...data.tasks.map((t) => [t.title, t.type, t.date || "", t.time || "", t.done ? "Yes" : "No", t.contact || "", t.caseNo || "", t.description || "", t.doneNote || ""]),
    ],
    timeLogs: () => [["Date", "Category", "Minutes", "Course", "Note"], ...data.timeLogs.map((l) => [l.date, l.category, l.minutes, course(l.courseId), l.note || ""])],
    letters: () => [["Date", "Sender", "Subject", "Status", "Deadline", "Note"], ...data.letters.map((l) => [l.date, l.sender, l.subject, l.status, l.deadline || "", l.note || ""])],
    contacts: () => [["Name", "Organization", "Category", "Phone", "Email", "Address", "Opening hours", "Case number"], ...data.contacts.map((c) => [c.name, c.org || "", c.category || "", c.phone || "", c.email || "", c.address || "", c.hours || "", c.caseNo || ""])],
    leisure: () => [["Title", "Category", "Address", "Cost", "Visited", "Date", "Rating"], ...data.leisure.map((l) => [l.title, l.category || "", l.address || "", l.estCost || "", l.done ? "Yes" : "No", l.visitedDate || "", l.rating || ""])],
    jobs: () => [["Company", "Position", "Type", "Status", "Contact", "Phone", "Address", "Salary"], ...data.jobs.map((j) => [j.company, j.position || "", j.jobType || "", j.status || "", j.contactPerson || "", j.phone || "", j.address || "", `${j.salary || ""} ${j.salaryUnit || ""}`])],
    vocab: () => [["Artikel", "Word", "Meaning", "Example", "Learned"], ...data.vocab.map((v) => [v.article || "", v.word, v.meaning || "", v.example || "", v.learned ? "Yes" : "No"])],
    shopping: () => [["Item", "Quantity", "Store", "Bought"], ...data.shopping.map((s) => [s.text, s.qty || "", s.store || "", s.done ? "Yes" : "No"])],
  };
  downloadCSV(`planner-${key}`, tables[key]());
}
export const CSV_SECTIONS = {
  receipts: "Expenses (receipts)", income: "Income", future: "Upcoming expenses", tasks: "Tasks", timeLogs: "Time logs",
  letters: "Letters", contacts: "Contacts", leisure: "Leisure", jobs: "Jobs", vocab: "German vocabulary", shopping: "Shopping list",
};
