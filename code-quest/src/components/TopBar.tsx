import { NavLink } from 'react-router-dom';
import { useProgress } from '../engine/store';
import { totalXp } from '../engine/progress';
import { levelProgress } from '../engine/xp';
import { rankFor } from '../engine/ranks';
import { currentStreak } from '../engine/streak';
import { dueCards } from '../engine/srs';

export function TopBar() {
  const p = useProgress((s) => s.p);
  const xp = totalXp(p);
  const lp = levelProgress(xp);
  const { rank } = rankFor(xp);
  const streak = currentStreak(p.activeDays);
  const due = dueCards(p.srs, Date.now()).length;
  const muted = p.settings.muted;
  return (
    <header className="topbar">
      <NavLink to="/" className="logo">
        ⚔️ <span>Code Quest</span>
      </NavLink>
      <nav className="nav">
        <NavLink to="/" end>🗺️ Map</NavLink>
        <NavLink to="/sandbox">🧪 Free Code</NavLink>
        <NavLink to="/review">
          🔁 Review{due > 0 && <span className="badge">{due}</span>}
        </NavLink>
        <NavLink to="/achievements">🏅 Badges</NavLink>
        <NavLink to="/dashboard">📊 Progress</NavLink>
        <NavLink to="/settings" aria-label="Settings">⚙️</NavLink>
      </nav>
      <div className="hud">
        <span className="streak" title="Daily streak: days in a row with at least one completed item">
          🔥 {streak}
        </span>
        <span className="rank" title={`Rank: ${rank.name}`}>
          {rank.icon} {rank.name}
        </span>
        <div className="xpbar" title={`${lp.into} / ${lp.needed} XP to level ${lp.level + 1}`}>
          <div className="xpbar-label">
            Lv {lp.level} · {xp.toLocaleString()} XP
          </div>
          <div className="xpbar-track">
            <div className="xpbar-fill" style={{ width: `${Math.round(lp.pct * 100)}%` }} />
          </div>
        </div>
        <button
          className="icon-btn"
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          title={muted ? 'Sound off' : 'Sound on'}
          onClick={() => useProgress.getState().setSetting('muted', !muted)}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
}
