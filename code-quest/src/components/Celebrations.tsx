import { useEffect, useRef } from 'react';
import { useEvents } from '../engine/store';
import { play } from '../lib/sound';
import { burst } from '../lib/confetti';

/** Toasts for XP, level-ups, ranks, achievements and boss wins. */
export function Celebrations() {
  const events = useEvents((s) => s.events);
  const dismiss = useEvents((s) => s.dismiss);

  const handled = useRef(new Set<number>());
  useEffect(() => {
    for (const e of events) {
      if (handled.current.has(e.id)) continue;
      handled.current.add(e.id);
      if (e.type === 'levelup' || e.type === 'rank' || e.type === 'boss') {
        play(e.type === 'boss' ? 'boss' : 'levelup');
        burst(true);
      } else if (e.type === 'achievement') play('achievement');
      if (e.type === 'xp' || e.type === 'achievement') {
        setTimeout(() => dismiss(e.id), e.type === 'xp' ? 2400 : 5000);
      }
    }
  }, [events, dismiss]);

  const big = events.find((e) => e.type === 'levelup' || e.type === 'rank' || e.type === 'boss');

  return (
    <>
      {big && (
        <div className="big-celebrate" onClick={() => dismiss(big.id)} role="status">
          <div className="big-card pop">
            {big.type === 'levelup' && (
              <>
                <div className="big-emoji">⬆️</div>
                <h2>Level up!</h2>
                <p>You reached level {big.level}.</p>
              </>
            )}
            {big.type === 'rank' && (
              <>
                <div className="big-emoji">{big.icon}</div>
                <h2>New rank: {big.name}</h2>
                <p>Your skills are leveling up for real.</p>
              </>
            )}
            {big.type === 'boss' && (
              <>
                <div className="big-emoji">🏆</div>
                <h2>Boss defeated!</h2>
                <p>{big.title} — +150 XP bonus. A new world may have opened!</p>
              </>
            )}
            <button className="btn primary">Awesome!</button>
          </div>
        </div>
      )}
      <div className="toasts" aria-live="polite">
        {events
          .filter((e) => e.type === 'xp' || e.type === 'achievement')
          .map((e) => (
            <div key={e.id} className={`toast toast-${e.type}`} onClick={() => dismiss(e.id)}>
              {e.type === 'xp' && (
                <>
                  <strong>+{e.amount} XP</strong> <span>{e.reason}</span>
                </>
              )}
              {e.type === 'achievement' && (
                <>
                  <span className="toast-icon">{e.a.icon}</span>
                  <div>
                    <strong>Badge unlocked: {e.a.name}</strong>
                    <div className="small">{e.a.description}</div>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </>
  );
}
