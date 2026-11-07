import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { Celebrations } from './components/Celebrations';
import { WorldMap } from './screens/WorldMap';
import { LevelView } from './screens/LevelView';
import { Sandbox } from './screens/Sandbox';
import { Review } from './screens/Review';
import { Achievements } from './screens/Achievements';
import { Dashboard } from './screens/Dashboard';
import { Settings } from './screens/Settings';
import { useActiveTime } from './lib/useActiveTime';
import { pythonHost } from './runners/runner';

export function App() {
  useActiveTime();
  useEffect(() => {
    // Start booting Python in the background so the first Run is fast.
    const t = setTimeout(() => pythonHost.warmUp(), 800);
    return () => clearTimeout(t);
  }, []);
  return (
    <HashRouter>
      <div className="app">
        <TopBar />
        <main className="main">
          <Routes>
            <Route path="/" element={<WorldMap />} />
            <Route path="/world/:worldId" element={<WorldMap />} />
            <Route path="/level/:levelId" element={<LevelView />} />
            <Route path="/level/:levelId/:itemIdx" element={<LevelView />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/review" element={<Review />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<div className="page"><h2>Lost in the code woods</h2><NavLink to="/">Back to the map</NavLink></div>} />
          </Routes>
        </main>
        <Celebrations />
      </div>
    </HashRouter>
  );
}
