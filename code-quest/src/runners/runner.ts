// Unified, main-thread API for running and grading code in any language.
// Each language runs in its own Web Worker (or sandboxed iframe for DOM code)
// and is killed + restarted if it exceeds the time limit.
import type { Exercise, GradeResult, Lang, RunError, RunOutput, Test } from '../engine/types';
import { TIMEOUT_ERROR, translateError } from './errorTranslator';
import { runDom } from './domSandbox';

const BASE = new URL(import.meta.env.BASE_URL || './', window.location.href).href;

type Status = 'idle' | 'loading' | 'ready';
type Listener = (s: Status) => void;

class WorkerHost {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, (msg: { ok: boolean; data?: unknown; error?: string }) => void>();
  status: Status = 'idle';
  private ready: Promise<void> = Promise.resolve();
  private listeners = new Set<Listener>();

  constructor(private make: () => Worker, private needsInit: boolean) {}

  onStatus(l: Listener) {
    this.listeners.add(l);
    l(this.status);
    return () => this.listeners.delete(l);
  }
  private setStatus(s: Status) {
    this.status = s;
    this.listeners.forEach((l) => l(s));
  }

  private get w(): Worker {
    if (!this.worker) {
      this.worker = this.make();
      this.worker.onmessage = (ev) => {
        const cb = this.pending.get(ev.data.id);
        if (cb) {
          this.pending.delete(ev.data.id);
          cb(ev.data);
        }
      };
      if (this.needsInit) {
        this.setStatus('loading');
        this.ready = this.send({ type: 'init' }, 180_000).then(
          () => this.setStatus('ready'),
          () => this.setStatus('idle'),
        );
      } else this.setStatus('ready');
    }
    return this.worker;
  }

  warmUp() {
    void this.w;
  }

  kill() {
    this.worker?.terminate();
    this.worker = null;
    for (const cb of this.pending.values()) cb({ ok: false, error: '__timeout__' });
    this.pending.clear();
    this.setStatus('idle');
  }

  /** Send a message; the time limit starts only once the runtime has booted. */
  async call<T>(msg: Record<string, unknown>, timeoutMs: number): Promise<T> {
    void this.w;
    await this.ready;
    return this.send<T>(msg, timeoutMs);
  }

  private send<T>(msg: Record<string, unknown>, timeoutMs: number): Promise<T> {
    const id = ++this.seq;
    const w = this.w;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.kill();
        reject(new Error('__timeout__'));
      }, timeoutMs);
      this.pending.set(id, (res) => {
        clearTimeout(timer);
        if (res.ok) resolve(res.data as T);
        else reject(new Error(res.error));
      });
      w.postMessage({ ...msg, id, base: BASE });
    });
  }
}

export const pythonHost = new WorkerHost(
  () => new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' }),
  true,
);
const jsHost = new WorkerHost(() => new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' }), false);
const sqlHost = new WorkerHost(() => new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' }), false);

const RUN_TIMEOUT = 5_000;

function isTimeout(e: unknown) {
  return e instanceof Error && e.message === '__timeout__';
}

function internal(e: unknown): RunError {
  return translateError({ type: 'InternalError', message: String((e as Error)?.message ?? e) }, 'python');
}

export interface RunOptions {
  stdin?: string[];
  dom?: { html: string };
  sqlSetup?: string;
}

export async function runCode(lang: Lang, code: string, opts: RunOptions = {}): Promise<RunOutput> {
  try {
    let out: RunOutput;
    if (lang === 'python') {
      out = await pythonHost.call<RunOutput>({ type: 'run', code, stdin: opts.stdin ?? [] }, RUN_TIMEOUT);
    } else if (lang === 'sql') {
      out = await sqlHost.call<RunOutput>({ type: 'run', code, setup: opts.sqlSetup ?? '' }, RUN_TIMEOUT);
    } else if (opts.dom || lang === 'html') {
      const r = await runDom(opts.dom?.html ?? '', code, null, RUN_TIMEOUT);
      out = { stdout: r.logs.join('\n'), error: r.error ?? undefined };
    } else {
      out = await jsHost.call<RunOutput>({ type: 'run', code, stdin: opts.stdin ?? [] }, RUN_TIMEOUT);
    }
    if (out.error) out.error = translateError(out.error, lang);
    return out;
  } catch (e) {
    if (isTimeout(e)) return { stdout: '', error: TIMEOUT_ERROR, timedOut: true };
    return { stdout: '', error: internal(e) };
  }
}

export async function gradeCode(
  lang: Lang,
  code: string,
  tests: Test[],
  opts: { dom?: { html: string }; sqlSetup?: string } = {},
): Promise<GradeResult> {
  const timeout = 4_000 + tests.length * 1_500;
  try {
    let res: GradeResult;
    if (lang === 'python') {
      const raw = await pythonHost.call<{ results: GradeResult['results']; fatal: RunError | null }>(
        { type: 'grade', code, tests },
        timeout,
      );
      res = { passed: !raw.fatal && raw.results.every((r) => r.passed), results: raw.results, fatal: raw.fatal ?? undefined };
    } else if (lang === 'sql') {
      res = await sqlHost.call<GradeResult>({ type: 'grade', code, tests, setup: opts.sqlSetup ?? '' }, timeout);
    } else if (opts.dom) {
      const r = await runDom(opts.dom.html, code, tests, timeout);
      if (r.error && !r.results?.length) {
        res = { passed: false, results: [], fatal: r.error };
      } else {
        const results = tests.map((t, i) => {
          const rr = r.results?.[i];
          return { name: t.name, explain: t.explain, passed: !!rr?.passed, got: rr?.got, error: rr?.error };
        });
        res = { passed: results.every((x) => x.passed), results };
      }
    } else {
      res = await jsHost.call<GradeResult>({ type: 'grade', code, tests }, timeout);
    }
    if (res.fatal) res.fatal = translateError(res.fatal, lang);
    for (const r of res.results) if (r.error) r.error = translateError(r.error, lang);
    res.passed = !res.fatal && res.results.length > 0 && res.results.every((r) => r.passed);
    return res;
  } catch (e) {
    if (isTimeout(e)) return { passed: false, results: [], fatal: TIMEOUT_ERROR, timedOut: true };
    return { passed: false, results: [], fatal: internal(e) };
  }
}

export function gradeExercise(ex: Exercise, code: string) {
  return gradeCode(ex.lang, code, ex.tests, { dom: ex.dom, sqlSetup: ex.sqlSetup });
}
