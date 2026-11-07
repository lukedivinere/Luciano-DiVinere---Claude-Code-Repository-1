import { useRef, useState } from 'react';
import { useProgress } from '../engine/store';

export function Settings() {
  const p = useProgress((s) => s.p);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const exportData = () => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `code-quest-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page">
      <h1>⚙️ Settings</h1>
      <div className="panel">
        <h3>Sound</h3>
        <label className="row">
          <input type="checkbox" checked={!p.settings.muted} onChange={(e) => useProgress.getState().setSetting('muted', !e.target.checked)} />
          Play sound effects
        </label>
      </div>
      <div className="panel">
        <h3>Your progress</h3>
        <p className="small muted">Progress is saved in this browser (localStorage). Export a backup to move it to another browser or computer.</p>
        <div className="row">
          <button className="btn" onClick={exportData}>⬇ Export backup</button>
          <button className="btn" onClick={() => file.current?.click()}>⬆ Import backup</button>
          <input
            ref={file}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const ok = useProgress.getState().importData(await f.text());
              setMsg(ok ? 'Backup imported.' : 'That file is not a valid Code Quest backup.');
            }}
          />
        </div>
        {msg && <p>{msg}</p>}
      </div>
      <div className="panel danger-zone">
        <h3>Danger zone</h3>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('Erase ALL progress (XP, levels, code, streak)? This cannot be undone.')) {
              useProgress.getState().reset();
              setMsg('Progress reset.');
            }
          }}
        >
          Reset all progress
        </button>
      </div>
    </div>
  );
}
