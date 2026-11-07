import { useEffect, useState } from 'react';
import { pythonHost } from '../runners/runner';

/** Shows "Loading Python…" while Pyodide boots (first run only). */
export function PyStatus() {
  const [s, setS] = useState(pythonHost.status);
  useEffect(() => {
    const off = pythonHost.onStatus(setS);
    return () => {
      off();
    };
  }, []);
  if (s !== 'loading') return null;
  return <span className="py-status">🐍 Loading Python (first time takes a few seconds)…</span>;
}
