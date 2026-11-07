/// <reference lib="webworker" />
// Runs Python via Pyodide off the main thread. The main thread kills and
// recreates this worker if code runs too long (e.g. an infinite loop).
import { PY_HARNESS } from './harness/pyHarness';

interface PyodideLike {
  runPython(code: string): unknown;
  globals: { get(name: string): (...args: unknown[]) => string };
}
let py: PyodideLike | null = null;
let loading: Promise<PyodideLike> | null = null;

async function load(base: string): Promise<PyodideLike> {
  if (py) return py;
  if (!loading) {
    loading = (async () => {
      const mod = await import(/* @vite-ignore */ `${base}pyodide/pyodide.mjs`);
      const inst = (await mod.loadPyodide({ indexURL: `${base}pyodide/` })) as PyodideLike;
      inst.runPython(PY_HARNESS);
      py = inst;
      return inst;
    })();
  }
  return loading;
}

self.onmessage = async (ev: MessageEvent) => {
  const { id, type, base, code, stdin, tests } = ev.data;
  try {
    const p = await load(base);
    if (type === 'init') {
      self.postMessage({ id, ok: true });
    } else if (type === 'run') {
      const out = p.globals.get('cq_run')(code, JSON.stringify(stdin ?? []));
      self.postMessage({ id, ok: true, data: JSON.parse(out) });
    } else if (type === 'grade') {
      const out = p.globals.get('cq_grade')(code, JSON.stringify(tests));
      self.postMessage({ id, ok: true, data: JSON.parse(out) });
    }
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e as Error)?.message ?? e) });
  }
};
