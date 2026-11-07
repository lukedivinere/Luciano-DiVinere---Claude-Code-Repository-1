import { useEffect, useState } from 'react';
import { pythonHost } from '../runners/runner';

/** Shows "Loading Python…" while Pyodide boots (first run only). */
export function PyStatus({ lang = 'python' }: { lang?: string }) {
  const [s, setS] = useState(pythonHost.status);
  useEffect(() => {
    const off = pythonHost.onStatus(setS);
    return () => {
      off();
    };
  }, []);
  if (s !== 'loading' || lang !== 'python') return null;
  return <span className="py-status">🐍 Loading Python (first time takes a few seconds)…</span>;
}
