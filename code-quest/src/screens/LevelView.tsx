import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { WORLDS } from '../content/registry';
import { useProgress } from '../engine/store';
import { itemUnlocked, levelUnlocked } from '../engine/progress';
import { levelItems, levelMinutes } from '../engine/content';
import { LearnView } from '../components/LearnView';
import { ExerciseView } from '../components/ExerciseView';
import { QuizView } from '../components/QuizView';
import type { ItemRef } from '../engine/types';

function findLevel(id: string) {
  for (let wi = 0; wi < WORLDS.length; wi++) {
    const li = WORLDS[wi].levels.findIndex((l) => l.id === id);
    if (li >= 0) return { wi, li, world: WORLDS[wi], level: WORLDS[wi].levels[li] };
  }
  return null;
}

function itemIcon(i: ItemRef) {
  if (i.kind === 'learn') return '📖';
  if (i.kind === 'quiz') return '❓';
  return { practice: '✏️', challenge: '⚔️', debug: '🐞', 'boss-step': '🐉' }[i.ex.type];
}
function itemTitle(i: ItemRef) {
  if (i.kind === 'learn') return i.card.title;
  if (i.kind === 'quiz') return 'Quiz';
  return i.ex.title;
}

export function LevelView() {
  const { levelId = '', itemIdx } = useParams();
  const nav = useNavigate();
  const p = useProgress((s) => s.p);
  const found = findLevel(levelId);
  if (!found) return <Navigate to="/" />;
  const { wi, li, world, level } = found;
  if (!levelUnlocked(p, WORLDS, wi, li)) return <Navigate to={`/world/${world.id}`} />;
  const items = levelItems(level);

  // Default: first not-done unlocked item.
  let idx = itemIdx !== undefined ? Number(itemIdx) : items.findIndex((i) => !p.items[i.id]?.done);
  if (idx < 0 || Number.isNaN(idx) || idx >= items.length) idx = itemIdx !== undefined ? 0 : items.length - 1;
  if (!itemUnlocked(p, level, idx)) {
    const firstOpen = items.findIndex((i, k) => itemUnlocked(p, level, k) && !p.items[i.id]?.done);
    return <Navigate to={`/level/${level.id}/${Math.max(0, firstOpen)}`} replace />;
  }
  const item = items[idx];

  const goNext = () => {
    if (idx + 1 < items.length) nav(`/level/${level.id}/${idx + 1}`);
    else {
      const nextLevel = world.levels[li + 1];
      nav(nextLevel ? `/world/${world.id}` : '/');
    }
  };

  const sections: { label: string; items: [ItemRef, number][] }[] = [];
  items.forEach((it, k) => {
    const label =
      it.kind === 'learn'
        ? 'Learn'
        : it.kind === 'quiz'
          ? 'Quiz'
          : level.practice.includes(it.ex)
            ? 'Practice'
            : level.kind === 'boss'
              ? 'Boss Battle'
              : 'Challenge';
    const last = sections[sections.length - 1];
    if (last && last.label === label) last.items.push([it, k]);
    else sections.push({ label, items: [[it, k]] });
  });

  return (
    <div className="level">
      <aside className="rail">
        <Link to={`/world/${world.id}`} className="back">
          ← World {world.number}
        </Link>
        <div className="rail-title">
          <span className="rail-icon">{level.icon}</span> {level.title}
        </div>
        <div className="small muted">⏱ {levelMinutes(level)} min total</div>
        <nav className="rail-steps">
          {sections.map((s) => (
            <div key={s.label + s.items[0][1]} className="rail-section">
              <div className="rail-label">{s.label}</div>
              {s.items.map(([it, k]) => {
                const done = !!p.items[it.id]?.done;
                const open = itemUnlocked(p, level, k);
                return (
                  <button
                    key={it.id}
                    disabled={!open}
                    className={`rail-step ${k === idx ? 'on' : ''} ${done ? 'done' : ''}`}
                    onClick={() => nav(`/level/${level.id}/${k}`)}
                  >
                    <span className="rs-icon">{done ? '✅' : open ? itemIcon(it) : '🔒'}</span>
                    <span className="rs-title">{itemTitle(it)}</span>
                    <span className="rs-min">{it.minutes}m</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="stage">
        {item.kind === 'learn' && <LearnView key={item.id} card={item.card} level={level} onNext={goNext} />}
        {item.kind === 'exercise' && <ExerciseView key={item.id} ex={item.ex} level={level} onNext={goNext} />}
        {item.kind === 'quiz' && <QuizView key={item.id} level={level} onNext={goNext} />}
      </div>
    </div>
  );
}
