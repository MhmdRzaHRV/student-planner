export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]; // Monday first
export const DAYS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const HOURS = ["07:45", "08:45", "09:45", "10:45", "11:45", "12:45", "13:45", "14:45", "15:45", "16:45", "17:45"];

export const EXPENSE_CATEGORIES = [
  "Groceries & food", "Hygiene", "Clothing", "Transport", "Phone & internet", "Rent & Nebenkosten",
  "Insurance", "University & books", "Restaurants & cafés", "Leisure", "Household", "Fees & admin",
  "Health & pharmacy", "Travel", "Gifts", "Pfand (deposit)", "Misc",
];

export const DEFAULT_STORES = [
  "Aldi", "Lidl", "Rewe", "Edeka", "Kaufland", "Penny", "Netto", "dm", "Rossmann", "Müller",
  "Action", "TEDi", "Primark", "H&M", "C&A", "MediaMarkt", "Saturn", "IKEA", "Amazon",
  "Apotheke", "Deutsche Bahn", "Bäckerei", "Döner",
];

// Common fixed costs in Germany — so nothing gets forgotten
export const FUTURE_TEMPLATES = [
  { title: "Rent (Miete)", category: "Rent & Nebenkosten", recurring: "monthly" },
  { title: "Nebenkosten / electricity & gas", category: "Rent & Nebenkosten", recurring: "monthly" },
  { title: "Kaution (rental deposit)", category: "Rent & Nebenkosten", recurring: "none" },
  { title: "Health insurance (Krankenversicherung)", category: "Insurance", recurring: "monthly" },
  { title: "Liability insurance (Haftpflicht)", category: "Insurance", recurring: "yearly" },
  { title: "Rundfunkbeitrag (GEZ)", category: "Fees & admin", recurring: "monthly" },
  { title: "Semesterbeitrag / Semesterticket", category: "University & books", recurring: "semester" },
  { title: "Deutschlandticket", category: "Transport", recurring: "monthly" },
  { title: "Mobile phone", category: "Phone & internet", recurring: "monthly" },
  { title: "Internet", category: "Phone & internet", recurring: "monthly" },
  { title: "Bank account fee", category: "Fees & admin", recurring: "monthly" },
  { title: "Residence permit renewal fee", category: "Fees & admin", recurring: "none" },
  { title: "Books & stationery for the semester", category: "University & books", recurring: "semester" },
  { title: "Subscription (Netflix/Spotify/...)", category: "Leisure", recurring: "monthly" },
];
export const RECURRING = { none: "One-time", monthly: "Monthly", semester: "Every semester (6 mo)", yearly: "Yearly" };

export const TASK_TYPES = ["Residence", "Citizenship", "University", "Insurance", "Bank", "Work & income", "Shopping", "Leisure", "Calls", "Health", "Housing", "Other"];

export const TASK_TEMPLATES = [
  { type: "Residence", title: "Anmeldung (address registration)" },
  { type: "Residence", title: "Ausländerbehörde appointment / Aufenthaltstitel" },
  { type: "University", title: "Immatrikulation (final enrollment)" },
  { type: "University", title: "Get Semesterticket / student ID card" },
  { type: "Bank", title: "Open a bank account" },
  { type: "Bank", title: "Sperrkonto: follow up monthly withdrawal" },
  { type: "Insurance", title: "Health insurance: sign up and get the card" },
  { type: "Insurance", title: "Liability insurance (Haftpflicht)" },
  { type: "Residence", title: "Get Steuer-ID" },
  { type: "Housing", title: "Register Rundfunkbeitrag" },
  { type: "Calls", title: "German SIM card" },
  { type: "Work & income", title: "Check student work permission" },
];

export const TASK_COLORS = {
  "Residence": "#e11d48", "Citizenship": "#be123c", "University": "#2563eb", "Insurance": "#0891b2", "Bank": "#0d9488",
  "Work & income": "#16a34a", "Shopping": "#d97706", "Leisure": "#c026d3", "Calls": "#7c3aed", "Health": "#dc2626",
  "Housing": "#65a30d", "Other": "#64748b",
};

export const COURSE_TYPES = ["Vorlesung (VL)", "Übung (Ü)", "Labor / Praktikum", "Tutorium", "Seminar", "Projekt"];
export const COURSE_COLORS = ["#2563eb", "#16a34a", "#d97706", "#c026d3", "#e11d48", "#0891b2", "#7c3aed", "#65a30d", "#ea580c", "#475569"];

export const TIME_CATS = {
  class: { label: "Class", color: "#2563eb" },
  study: { label: "Study", color: "#16a34a" },
  lab: { label: "Lab", color: "#0891b2" },
  project: { label: "Project", color: "#7c3aed" },
  work: { label: "Work", color: "#d97706" },
  german: { label: "German", color: "#e11d48" },
  other: { label: "Other", color: "#64748b" },
};

export const INCOME_TYPES = ["Salary / work", "Money from family", "Refund", "Gift", "Other"];

export const LETTER_STATUS = { new: "New", todo: "Needs action", replied: "Replied", done: "Closed" };
export const LEISURE_CATS = ["Nature & parks", "City & sights", "Museums & culture", "Restaurants & cafés", "Events & concerts", "Sports", "Short trip", "Other"];
export const CONTACT_CATS = ["Authority / government", "University", "Insurance", "Bank", "Housing & landlord", "Work", "Doctor", "Friend", "Other"];

export const JOB_TYPES = ["Werkstudent", "Minijob", "Praktikum", "Nebenjob", "Vollzeit", "Other"];
export const JOB_STATUS = { searching: "Searching", applied: "Applied", interview: "Interview", offer: "Got an offer", rejected: "Rejected" };

export const ARTICLES = ["der", "die", "das", "—"];
export const GERMAN_SKILLS = ["Lesen", "Hören", "Schreiben", "Sprechen", "Grammatik", "Wortschatz", "Language class"];

export const ROUTINE_TEMPLATE = {
  name: "University day routine",
  days: [0, 1, 2, 3, 4],
  items: [
    { text: "Wake up and have breakfast", time: "07:00" },
    { text: "Review today's classes", time: "07:30" },
    { text: "30 minutes of German", time: "19:00" },
    { text: "Plan tomorrow", time: "21:30" },
  ],
};

export const THEMES = [
  ["system", "Match system"],
  ["light", "Light"],
  ["dark", "Dark"],
  ["slate", "Gray-blue"],
  ["slate-dark", "Gray-blue (dark)"],
];
