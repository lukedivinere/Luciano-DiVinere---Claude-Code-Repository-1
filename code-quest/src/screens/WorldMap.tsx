import { Link, useNavigate, useParams } from 'react-router-dom';
import { WORLDS } from '../content/registry';
import { useProgress } from '../engine/store';
import { levelComplete, levelDoneCount, levelUnlocked, worldUnlocked } from '../engine/progress';
import { levelItems, levelMinutes, worldMinutes } from '../engine/content';
import type { Level, World } from '../engine/types';

function doneMinutes(p: ReturnType<typeof useProgress.getState>['p'], level: Level) {
  return levelItems(level).filter((i) => p.items[i.id]?.done).reduce((s, i) => s + i.minutes, 0);
}

export function WorldMap() {
  const { worldId } = useParams();
  const nav = useNavigate();
  const p = useProgress((s) => s.p);
  // Default to the furthest unlocked world.
  let wi = WORLDS.findIndex((w) => w.id === worldId);
  if (wi < 0) {
    wi = 0;
    for (let i = 0; i < WORLDS.length; i++) if (worldUnlocked(p, WORLDS, i)) wi = i;
  }
  const world = WORLDS[wi];
  const unlocked = worldUnlocked(p, WORLDS, wi);
  const total = worldMinutes(world);
  const done = world.levels.reduce((s, l) => s + doneMinutes(p, l), 0);
  const grandTotal = WORLDS.reduce((s, w) => s + worldMinutes(w), 0);
  const grandDone = WORLDS.reduce((s, w) => s + w.levels.reduce((a, l) => a + doneMinutes(p, l), 0), 0);
  const nextIdx = world.levels.findIndex((l, li) => levelUnlocked(p, WORLDS, wi, li) && !levelComplete(p, l));

  return (
    <div className="map-page" style={{ ['--world-accent' as string]: world.theme.accent }}>
      <div className="world-tabs" role="tablist">
        {WORLDS.map((w, i) => {
          const open = worldUnlocked(p, WORLDS, i);
          return (
            <button
              key={w.id}
              role="tab"
              aria-selected={i === wi}
              className={`world-tab ${i === wi ? 'on' : ''} ${open ? '' : 'locked'}`}
              onClick={() => nav(`/world/${w.id}`)}
            >
              {open ? '' : '🔒 '}World {w.number}: {w.title}
              <span className="small muted"> · {worldMinutes(w)} min</span>
            </button>
          );
        })}
      </div>
      <div className="world-header" style={{ background: world.theme.bg }}>
        <div>
          <h1>
            World {world.number}: {world.title}
          </h1>
          <p className="muted">{world.subtitle}</p>
        </div>
        <div className="world-stats">
          <div className="minutes-pill" title="Estimated minutes of real work in this world">
            ⏱ {done} / {total} min
          </div>
          <div className="small muted">All worlds: {grandDone} / {grandTotal} min</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>
      {!unlocked && (
        <div className="locked-banner">🔒 Beat the World {world.number - 1} Boss to open this world.</div>
      )}
      <MapPath world={world} wi={wi} p={p} nextIdx={nextIdx} />
    </div>
  );
}

function MapPath({ world, wi, p, nextIdx }: { world: World; wi: number; p: ReturnType<typeof useProgress.getState>['p']; nextIdx: number }) {
  return (
    <ol className="path">
      {world.levels.map((l, li) => {
        const open = levelUnlocked(p, WORLDS, wi, li);
        const complete = levelComplete(p, l);
        const { done, total } = levelDoneCount(p, l);
        const state = complete ? 'done' : open ? 'open' : 'locked';
        const side = li % 2 === 0 ? 'left' : 'right';
        const node = (
          <>
            <div className={`node node-${l.kind}`}>{complete ? '✓' : open ? l.icon : '🔒'}</div>
            <div className="node-info">
              <div className="node-title">
                {l.kind === 'boss' ? 'BOSS · ' : l.kind === 'debug' ? '🐞 ' : `${li + 1}. `}
                {l.title}
              </div>
              <div className="node-sub">{l.summary}</div>
              <div className="node-meta">
                <span>⏱ {levelMinutes(l)} min</span>
                <span>
                  {done}/{total} steps
                </span>
              </div>
            </div>
          </>
        );
        return (
          <li key={l.id} className={`stop ${state} ${side} ${li === nextIdx ? 'next' : ''}`}>
            {open ? (
              <Link to={`/level/${l.id}`} className="stop-link" aria-label={`${l.title}${complete ? ' (complete)' : ''}`}>
                {node}
              </Link>
            ) : (
              <div className="stop-link" aria-disabled="true" title="Finish the previous level to unlock">
                {node}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
