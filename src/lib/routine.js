import { PRIZE_TIERS, RANKS } from "./constants";
import { addDays, diffDays, pct, todayISO, weekdayIdx } from "./utils";

// Completion info for one date, based on the routines scheduled for that weekday
export function dayInfo(data, d) {
  const wd = weekdayIdx(d);
  const rs = data.routines.filter((r) => r.days.includes(wd));
  const ids = rs.flatMap((r) => r.items.map((i) => i.id));
  const chk = data.routineChecks[d] || {};
  const done = ids.filter((id) => chk[id]).length;
  return { rs, total: ids.length, done, pct: pct(done, ids.length), chk };
}

// Stats used by the Rewards page and the dashboard.
// "Perfect day" = every item of every routine scheduled for that day is checked.
export function routineStats(data) {
  const today = todayISO();
  const dates = Object.keys(data.routineChecks).filter((d) => d <= today).sort();
  let perfect = 0;
  let items = 0;
  let challenges = 0;
  const perfectDates = new Set();
  for (const d of dates) {
    const x = dayInfo(data, d);
    items += x.done;
    if (x.total && x.done === x.total) {
      perfect++;
      perfectDates.add(d);
    }
    if (data.routineChecks[d]?.challenge) challenges++;
  }
  // streak: days without any scheduled routine are neutral; today never breaks a streak
  let run = 0;
  let longest = 0;
  if (dates.length) {
    const span = diffDays(today, dates[0]);
    for (let i = 0; i <= span; i++) {
      const d = addDays(dates[0], i);
      const x = dayInfo(data, d);
      if (!x.total) continue;
      if (x.done === x.total) {
        run++;
        longest = Math.max(longest, run);
      } else if (d !== today) run = 0;
    }
  }
  const xp = items * 10 + perfect * 50 + challenges * 20;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const levelStart = (level - 1) ** 2 * 100;
  const levelEnd = level ** 2 * 100;
  const rank = [...RANKS].reverse().find((r) => perfect >= r[0]) || RANKS[0];
  return { perfect, perfectDates, streak: run, longest, xp, level, levelStart, levelEnd, rank, items };
}

// Which prize tier does the n-th perfect day unlock? (highest tier whose interval divides n)
export function tierFor(n) {
  const tiers = Object.entries(PRIZE_TIERS).sort((a, b) => b[1].every - a[1].every);
  const t = tiers.find(([, v]) => n % v.every === 0);
  return t ? t[0] : null;
}
export function nextMilestone(count) {
  for (let n = count + 1; n < count + 400; n++) {
    const t = tierFor(n);
    if (t) return { n, tier: t };
  }
  return null;
}

// deterministic "random" pick per day
export const dayHash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
