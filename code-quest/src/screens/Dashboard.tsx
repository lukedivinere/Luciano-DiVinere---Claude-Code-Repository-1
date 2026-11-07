import { WORLDS } from '../content/registry';
import { CONCEPTS } from '../content/concepts';
import { useProgress } from '../engine/store';
import { exerciseAccuracy, levelComplete, masteredConcepts, totalXp } from '../engine/progress';
import { levelProgress } from '../engine/xp';
import { rankFor } from '../engine/ranks';
import { currentStreak, longestStreak } from '../engine/streak';
import { addDays, dayKey } from '../engine/dates';
import { levelItems, worldMinutes } from '../engine/content';

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function Bars({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars" role="img" aria-label={`Last ${data.length} days, ${unit}`}>
      {data.map((d) => (
        <div key={d.label} className="bar-col" title={`${d.label}: ${d.value} ${unit}`}>
          <div className="bar" style={{ height: `${(d.value / max) * 100}%` }} />
          <div className="bar-label">{d.label.slice(8)}</div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const p = useProgress((s) => s.p);
  const xp = totalXp(p);
  const lp = levelProgress(xp);
  const { rank, next } = rankFor(xp);
  const acc = exerciseAccuracy(p);
  const quizPct = p.quizStats.answered ? Math.round((p.quizStats.correct / p.quizStats.answered) * 100) : 0;
  const mastered = masteredConcepts(p, WORLDS);
  const allConcepts = [...new Set(WORLDS.flatMap((w) => w.levels.flatMap((l) => l.teaches)))];
  const today = dayKey();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const xpByDay = days.map((d) => ({ label: d, value: p.xpLog.filter((e) => dayKey(e.t) === d).reduce((s, e) => s + e.xp, 0) }));
  const minByDay = days.map((d) => ({ label: d, value: Math.round((p.time.byDay[d] ?? 0) / 60) }));

  return (
    <div className="page dashboard">
      <h1>📊 Progress</h1>
      <div className="stat-grid">
        <Stat label="Total XP" value={xp.toLocaleString()} sub={`Level ${lp.level}`} />
        <Stat label="Rank" value={`${rank.icon} ${rank.name}`} sub={next ? `${(next.minXp - xp).toLocaleString()} XP to ${next.name}` : 'Top rank!'} />
        <Stat label="Time coding" value={fmtTime(p.time.totalSec)} sub={`Today: ${fmtTime(p.time.byDay[today] ?? 0)}`} />
        <Stat label="Streak" value={`🔥 ${currentStreak(p.activeDays)} days`} sub={`Best: ${longestStreak(p.activeDays)} days`} />
        <Stat label="First-try accuracy" value={acc.done ? `${Math.round((acc.firstTry / acc.done) * 100)}%` : '—'} sub={`${acc.firstTry} of ${acc.done} exercises`} />
        <Stat label="Quiz accuracy" value={p.quizStats.answered ? `${quizPct}%` : '—'} sub={`${p.quizStats.correct} of ${p.quizStats.answered} answers`} />
      </div>
      <div className="chart-row">
        <div className="panel">
          <h3>XP earned · last 14 days</h3>
          <Bars data={xpByDay} unit="XP" />
        </div>
        <div className="panel">
          <h3>Minutes coding · last 14 days</h3>
          <Bars data={minByDay} unit="min" />
        </div>
      </div>
      <div className="panel">
        <h3>Worlds</h3>
        {WORLDS.map((w) => {
          const items = w.levels.flatMap(levelItems);
          const doneMin = items.filter((i) => p.items[i.id]?.done).reduce((s, i) => s + i.minutes, 0);
          const total = worldMinutes(w);
          return (
            <div key={w.id} className="world-row">
              <div>
                World {w.number}: {w.title} <span className="muted small">· {w.levels.filter((l) => levelComplete(p, l)).length}/{w.levels.length} levels</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(doneMin / total) * 100}%` }} />
              </div>
              <div className="small muted">
                {doneMin} / {total} min
              </div>
            </div>
          );
        })}
      </div>
      <div className="panel">
        <h3>
          Concepts mastered: {mastered.length} / {allConcepts.length}
        </h3>
        <p className="small muted">A concept is mastered when you've finished every level that teaches it and you have no weak review cards for it.</p>
        <div className="chips">
          {allConcepts.map((c) => (
            <span key={c} className={`chip ${mastered.includes(c) ? 'on' : ''}`}>
              {mastered.includes(c) ? '✓ ' : ''}
              {CONCEPTS[c] ?? c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="small muted">{sub}</div>
    </div>
  );
}
