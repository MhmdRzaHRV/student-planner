import { useState } from "react";
import { useStore } from "../store.jsx";
import { CHALLENGES, DEFAULT_PRIZES, PRIZE_TIERS, QUOTES } from "../lib/constants";
import { dayHash, nextMilestone, routineStats, tierFor } from "../lib/routine";
import { fmtDate, todayISO } from "../lib/utils";
import { confirmDel, Empty, Field, Modal, PageHeader, Progress, Stat } from "../components/ui.jsx";

const JOURNEY = 360; // the long-term goal: 360 perfect days

export default function Rewards({ go }) {
  const { data, setKey, add, update, remove } = useStore();
  const [popup, setPopup] = useState(null);
  const [newPrize, setNewPrize] = useState({ tier: "small", text: "" });
  const today = todayISO();
  const st = routineStats(data);
  const h = dayHash(today);
  const quote = QUOTES[h % QUOTES.length];
  const challenge = CHALLENGES[h % CHALLENGES.length];
  const challengeDone = !!(data.routineChecks[today] || {}).challenge;

  // milestones reached but not opened yet
  const claimed = new Set(data.claims.map((c) => c.n));
  const pending = [];
  for (let n = 1; n <= st.perfect; n++) {
    const tier = tierFor(n);
    if (tier && !claimed.has(n)) pending.push({ n, tier });
  }
  const next = nextMilestone(st.perfect);
  const pool = [...DEFAULT_PRIZES.map(([tier, text]) => ({ tier, text })), ...data.prizes];

  function openPrize(m) {
    const all = pool.filter((p) => p.tier === m.tier);
    const fresh = all.filter((p) => !data.claims.some((c) => c.text === p.text));
    const list = fresh.length ? fresh : all;
    const pick = list[Math.floor(Math.random() * list.length)];
    const claim = { n: m.n, tier: m.tier, text: pick?.text || "Do something nice for yourself 🎉", date: today, used: false };
    add("claims", claim);
    setPopup(claim);
  }

  const toggleChallenge = () =>
    setKey("routineChecks", (c) => ({ ...c, [today]: { ...(c[today] || {}), challenge: !(c[today] || {}).challenge } }));

  const milestoneAt = (n) => tierFor(n);
  const xpPct = ((st.xp - st.levelStart) / (st.levelEnd - st.levelStart)) * 100;

  return (
    <>
      <PageHeader title="Rewards & streak" sub="Finish your daily routine, earn XP and real prizes. Every perfect day counts, even after a missed day.">
        <button className="btn" onClick={() => go("routine")}>Open today's routine</button>
      </PageHeader>

      <div className="card hero">
        <div className="flame">{st.streak >= 7 ? "🔥" : st.streak > 0 ? "✨" : "🌱"}</div>
        <div>
          <div className="big-num">{st.streak}</div>
          <div className="muted">day streak · best {st.longest}</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="row between"><span className="rank">{st.rank[1]}</span><small className="muted">{st.rank[2]}</small></div>
          <div className="row between gap-top"><strong>Level {st.level}</strong><small className="muted num">{st.xp} XP · next level at {st.levelEnd}</small></div>
          <Progress value={xpPct} />
        </div>
      </div>

      <div className="grid stats">
        <Stat label="Perfect days" value={`${st.perfect}/${JOURNEY}`} sub="total, not only in a row" tone="good" />
        <Stat label="Prizes opened" value={data.claims.length} sub={pending.length ? `${pending.length} waiting for you!` : "keep going"} />
        <Stat
          label="Next prize"
          value={next ? `Day ${next.n}` : "—"}
          sub={next ? `${next.n - st.perfect} more perfect day${next.n - st.perfect === 1 ? "" : "s"} · ${PRIZE_TIERS[next.tier].icon} ${PRIZE_TIERS[next.tier].label}` : ""}
        />
      </div>

      {pending.length > 0 && (
        <div className="card gap-top" style={{ borderColor: "var(--good)" }}>
          <h2>🎁 Prizes waiting for you</h2>
          <div className="milestones">
            {pending.map((m) => (
              <div className="milestone hit" key={m.n}>
                <div style={{ fontSize: "1.6rem" }}>{PRIZE_TIERS[m.tier].icon}</div>
                <small>Day {m.n}</small>
                <div><button className="btn primary sm" onClick={() => openPrize(m)}>Open</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-top">
        <div className="card">
          <h2>⚡ Daily challenge</h2>
          <label className={`check ${challengeDone ? "done" : ""}`}>
            <input type="checkbox" checked={challengeDone} onChange={toggleChallenge} />
            <span>{challenge}</span>
          </label>
          <small className="muted">+20 XP when done. A new challenge appears every day.</small>
        </div>
        <div className="card">
          <h2>💬 Today's push</h2>
          <div className="quote">{quote}</div>
        </div>
      </div>

      <div className="card gap-top">
        <h2>🗺️ Your {JOURNEY}-day journey</h2>
        <div className="heat" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
          {Array.from({ length: JOURNEY }, (_, i) => i + 1).map((n) => {
            const t = milestoneAt(n);
            const done = n <= st.perfect;
            return (
              <i
                key={n}
                title={`Day ${n}${t ? ` · ${PRIZE_TIERS[t].label}` : ""}${done ? " ✓" : ""}`}
                style={{
                  background: done ? "var(--good)" : undefined,
                  outline: t ? `2px solid ${PRIZE_TIERS[t].color}` : undefined,
                  outlineOffset: t ? "-1px" : undefined,
                }}
              />
            );
          })}
        </div>
        <div className="row gap-top">
          {Object.values(PRIZE_TIERS).map((t) => (
            <small key={t.label} className="muted"><span className="tier" style={{ background: t.color }}>{t.icon} every {t.every}</span> {t.label}</small>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>🏆 Prize history</h2>
        {data.claims.length === 0 ? <Empty>No prizes opened yet. Your first one comes at perfect day 7.</Empty> : [...data.claims].sort((a, b) => b.n - a.n).map((c) => (
          <div className="item" key={c.id}>
            <span style={{ fontSize: "1.5rem" }}>{PRIZE_TIERS[c.tier].icon}</span>
            <div className="item-main">
              <strong className={c.used ? "muted" : ""} style={{ textDecoration: c.used ? "line-through" : "none" }}>{c.text}</strong>
              <small className="muted">Day {c.n} · opened {fmtDate(c.date)}</small>
            </div>
            <label className="check"><input type="checkbox" checked={!!c.used} onChange={(e) => update("claims", c.id, { used: e.target.checked })} /> Enjoyed it</label>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>🎲 Prize pool</h2>
        <p className="muted">Prizes are drawn at random from your pool. Add real rewards that motivate you.</p>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newPrize.text.trim()) return;
            add("prizes", { tier: newPrize.tier, text: newPrize.text.trim() });
            setNewPrize({ ...newPrize, text: "" });
          }}
        >
          <select style={{ width: 190 }} value={newPrize.tier} onChange={(e) => setNewPrize({ ...newPrize, tier: e.target.value })}>
            {Object.entries(PRIZE_TIERS).map(([k, t]) => <option key={k} value={k}>{t.icon} {t.label}</option>)}
          </select>
          <input style={{ flex: 1, minWidth: 180 }} placeholder="e.g. Buy that book, new sneakers, cinema…" value={newPrize.text} onChange={(e) => setNewPrize({ ...newPrize, text: e.target.value })} />
          <button className="btn primary">＋ Add prize</button>
        </form>
        {Object.entries(PRIZE_TIERS).map(([k, t]) => {
          const mine = data.prizes.filter((p) => p.tier === k);
          const defaults = DEFAULT_PRIZES.filter(([tier]) => tier === k);
          return (
            <details className="gap-top" key={k}>
              <summary>{t.icon} {t.label} · every {t.every} perfect days ({defaults.length + mine.length} prizes)</summary>
              <ul>
                {mine.map((p) => (
                  <li key={p.id}>{p.text} <button className="btn ghost sm danger" onClick={() => confirmDel("Delete this prize?") && remove("prizes", p.id)}>✕</button></li>
                ))}
                {defaults.map(([, text]) => <li key={text} className="muted">{text}</li>)}
              </ul>
            </details>
          );
        })}
      </div>

      {popup && (
        <Modal title="You earned a prize!" onClose={() => setPopup(null)}>
          <div className="prize-pop">
            <div className="emoji">{PRIZE_TIERS[popup.tier].icon}</div>
            <h3>{popup.text}</h3>
            <p className="muted">{PRIZE_TIERS[popup.tier].label} · perfect day {popup.n}</p>
            <button className="btn primary" onClick={() => setPopup(null)}>Awesome!</button>
          </div>
        </Modal>
      )}
    </>
  );
}
