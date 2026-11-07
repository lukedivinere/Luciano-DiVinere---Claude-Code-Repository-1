import { useProgress } from '../engine/store';
import { ACHIEVEMENTS } from '../engine/achievements';

export function Achievements() {
  const p = useProgress((s) => s.p);
  const earned = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;
  return (
    <div className="page">
      <h1>🏅 Badges</h1>
      <p className="muted">
        {earned} of {ACHIEVEMENTS.length} earned
      </p>
      <div className="badges">
        {ACHIEVEMENTS.map((a) => {
          const at = p.achievements[a.id];
          return (
            <div key={a.id} className={`badge-card ${at ? 'earned' : 'locked'}`}>
              <div className="badge-icon">{at ? a.icon : '🔒'}</div>
              <div className="badge-name">{a.name}</div>
              <div className="small muted">{a.description}</div>
              {at && <div className="small earned-at">Earned {new Date(at).toLocaleDateString()}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
