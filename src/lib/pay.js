// Payment methods: "cash" is always there; banks come from Settings.
export const payOptions = (settings) => [["cash", "💶 Cash"], ...settings.banks.map((b) => [b.id, `🏦 ${b.name}`])];
export const payName = (settings, id) => (id === "cash" ? "Cash" : settings.banks.find((b) => b.id === id)?.name || "(deleted)");
