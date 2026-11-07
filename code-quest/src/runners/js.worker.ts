/// <reference lib="webworker" />
import { gradeJs, runJs } from './harness/jsHarness';

self.onmessage = async (ev: MessageEvent) => {
  const { id, type, code, stdin, tests } = ev.data;
  try {
    const data = type === 'run' ? await runJs(code, stdin) : await gradeJs(code, tests);
    self.postMessage({ id, ok: true, data });
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e as Error)?.message ?? e) });
  }
};
