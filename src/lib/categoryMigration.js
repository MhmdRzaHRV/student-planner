// Legacy stored labels use escaped Unicode; all app labels are English.
const legacyLabels = [
  [
    "Groceries & food",
    "\u063a\u0630\u0627 \u0648 \u062e\u0648\u0627\u0631\u0628\u0627\u0631",
    "\u0645\u0648\u0627\u062f \u063a\u0630\u0627\u06cc\u06cc",
    "\u062e\u0648\u0631\u0627\u06a9",
    "\u062e\u0648\u0631\u0627\u06a9\u06cc",
    "\u062e\u0648\u0627\u0631\u0628\u0627\u0631",
    "\u062e\u0631\u06cc\u062f \u0645\u0648\u0627\u062f \u063a\u0630\u0627\u06cc\u06cc",
    "\u063a\u0630\u0627",
    "\u062e\u0648\u0627\u0631\u0628\u0627\u0631 \u0648 \u063a\u0630\u0627"
  ],
  [
    "Hygiene",
    "\u0628\u0647\u062f\u0627\u0634\u062a",
    "\u0628\u0647\u062f\u0627\u0634\u062a \u0634\u062e\u0635\u06cc"
  ],
  [
    "Clothing",
    "\u067e\u0648\u0634\u0627\u06a9",
    "\u0644\u0628\u0627\u0633"
  ],
  [
    "Transport",
    "\u062d\u0645\u0644 \u0648 \u0646\u0642\u0644",
    "\u062d\u0645\u0644\u200c\u0648\u0646\u0642\u0644",
    "\u0631\u0641\u062a \u0648 \u0622\u0645\u062f"
  ],
  [
    "Phone & internet",
    "\u062a\u0644\u0641\u0646 \u0648 \u0627\u06cc\u0646\u062a\u0631\u0646\u062a",
    "\u0645\u0648\u0628\u0627\u06cc\u0644 \u0648 \u0627\u06cc\u0646\u062a\u0631\u0646\u062a"
  ],
  [
    "Rent & Nebenkosten",
    "\u0627\u062c\u0627\u0631\u0647",
    "\u0627\u062c\u0627\u0631\u0647 \u0648 \u0642\u0628\u0648\u0636",
    "\u0627\u062c\u0627\u0631\u0647 \u0648 \u0647\u0632\u06cc\u0646\u0647\u200c\u0647\u0627\u06cc \u062c\u0627\u0646\u0628\u06cc"
  ],
  [
    "Insurance",
    "\u0628\u06cc\u0645\u0647"
  ],
  [
    "University & books",
    "\u062f\u0627\u0646\u0634\u06af\u0627\u0647 \u0648 \u06a9\u062a\u0627\u0628",
    "\u062a\u062d\u0635\u06cc\u0644",
    "\u062f\u0627\u0646\u0634\u06af\u0627\u0647"
  ],
  [
    "Restaurants & cafés",
    "\u0631\u0633\u062a\u0648\u0631\u0627\u0646 \u0648 \u06a9\u0627\u0641\u0647",
    "\u0631\u0633\u062a\u0648\u0631\u0627\u0646",
    "\u06a9\u0627\u0641\u0647"
  ],
  [
    "Leisure",
    "\u062a\u0641\u0631\u06cc\u062d",
    "\u062a\u0641\u0631\u06cc\u062d\u0627\u062a",
    "\u0633\u0631\u06af\u0631\u0645\u06cc"
  ],
  [
    "Household",
    "\u062e\u0627\u0646\u0647",
    "\u0644\u0648\u0627\u0632\u0645 \u062e\u0627\u0646\u0647",
    "\u0644\u0648\u0627\u0632\u0645 \u0645\u0646\u0632\u0644"
  ],
  [
    "Fees & admin",
    "\u0647\u0632\u06cc\u0646\u0647\u200c\u0647\u0627\u06cc \u0627\u062f\u0627\u0631\u06cc",
    "\u0627\u0645\u0648\u0631 \u0627\u062f\u0627\u0631\u06cc"
  ],
  [
    "Health & pharmacy",
    "\u0633\u0644\u0627\u0645\u062a \u0648 \u062f\u0627\u0631\u0648",
    "\u062f\u0631\u0645\u0627\u0646 \u0648 \u062f\u0627\u0631\u0648",
    "\u0633\u0644\u0627\u0645\u062a",
    "\u062f\u0627\u0631\u0648",
    "\u067e\u0632\u0634\u06a9\u06cc"
  ],
  [
    "Travel",
    "\u0633\u0641\u0631",
    "\u0645\u0633\u0627\u0641\u0631\u062a"
  ],
  [
    "Gifts",
    "\u0647\u062f\u06cc\u0647",
    "\u0647\u062f\u0627\u06cc\u0627"
  ],
  [
    "Pfand (deposit)",
    "\u0648\u062f\u06cc\u0639\u0647",
    "\u067e\u0641\u0627\u0646\u062f"
  ],
  [
    "Misc",
    "\u0645\u062a\u0641\u0631\u0642\u0647",
    "\u0633\u0627\u06cc\u0631"
  ]
];
const normalize = (value) => value.trim().replace(/\u064a/g, "\u06cc").replace(/\u0643/g, "\u06a9").replace(/\u200c/g, " ").replace(/\s+/g, " ");
const labels = new Map(legacyLabels.flatMap(([english, ...names]) => names.map((name) => [normalize(name), english])));
export function migrateCategories(data) {
  const custom = new Map();
  const translate = (value) => {
    if (typeof value !== "string") return value;
    const known = labels.get(normalize(value));
    if (known) return known;
    if (!/[\u0600-\u06ff]/.test(value)) return value;
    if (!custom.has(value)) custom.set(value, `Custom category ${custom.size + 1}`);
    return custom.get(value);
  };
  const categories = [...new Set(data.settings.categories.map(translate))];
  const categoryBudgets = {};
  for (const [name, amount] of Object.entries(data.settings.categoryBudgets)) {
    const key = translate(name);
    categoryBudgets[key] = (Number(categoryBudgets[key]) || 0) + (Number(amount) || 0);
  }
  return { ...data, settings: { ...data.settings, categories, categoryBudgets },
    receipts: data.receipts.map((receipt) => ({ ...receipt, items: receipt.items.map((item) => ({ ...item, category: translate(item.category) })) })),
    future: data.future.map((item) => ({ ...item, category: translate(item.category) })),
  };
}
