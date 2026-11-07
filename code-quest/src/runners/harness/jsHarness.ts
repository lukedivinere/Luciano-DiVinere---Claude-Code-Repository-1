// JavaScript grading harness (non-DOM). Runs inside a Web Worker in the app,
// and directly in Node for the content validator.
import type { GradeResult, RunError, RunOutput, Test, TestResult } from '../../engine/types';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...a: unknown[]) => Promise<unknown>;

export function formatValue(v: unknown, depth = 0): string {
  if (typeof v === 'string') return depth === 0 ? v : JSON.stringify(v);
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'function') return `[Function ${(v as { name?: string }).name || 'anonymous'}]`;
  if (Array.isArray(v)) return '[ ' + v.map((x) => formatValue(x, depth + 1)).join(', ') + ' ]';
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (v instanceof Promise) return 'Promise { <pending> }';
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return '{ ' + entries.map(([k, x]) => `${k}: ${formatValue(x, depth + 1)}`).join(', ') + ' }';
  }
  return String(v);
}

function makeConsole(lines: string[]) {
  const log = (...args: unknown[]) => lines.push(args.map((a) => formatValue(a)).join(' '));
  return { log, info: log, warn: log, error: log, table: log };
}

/** Find the learner's line number from a stack trace of code built by new Function.
 *  The learner code starts at line 3 of the generated function body. */
function lineFromStack(e: unknown, offset: number): number | undefined {
  const stack = (e as Error)?.stack ?? '';
  const m = stack.match(/<anonymous>:(\d+):\d+/);
  if (!m) return undefined;
  const n = Number(m[1]) - offset;
  return n > 0 ? n : undefined;
}

export function toRunError(e: unknown, offset = 2): RunError {
  if (e instanceof Error) {
    return { type: e.name, message: e.message, line: lineFromStack(e, offset) };
  }
  return { type: 'Error', message: `Your code threw a value that is not an Error: ${formatValue(e)}` };
}

function norm(s: string): string {
  const lines = s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd());
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    return (
      deepEqual(ka, kb) &&
      ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
    );
  }
  return a === b;
}

function assert(cond: unknown, msg?: string) {
  if (!cond) {
    const e = new Error(msg || 'Assertion failed');
    e.name = 'AssertionError';
    throw e;
  }
}

interface Instance {
  stdout: string[];
  evalIn: (src: string) => Promise<unknown>;
}

/** Run learner code once. Returns an evaluator that can look at the code's
 *  top-level variables and functions (via direct eval in the same scope). */
async function instantiate(code: string, stdin: string[] = [], setup = ''): Promise<{ inst: Instance; error?: RunError }> {
  const stdout: string[] = [];
  const consoleObj = makeConsole(stdout);
  const queue = [...stdin];
  const prompt = (msg?: string) => {
    if (msg) stdout.push(String(msg));
    return queue.length ? String(queue.shift()) : null;
  };
  const body = `${setup}\n;\n${code}\n;return async (__src) => eval(__src);`;
  let evalIn: (src: string) => Promise<unknown> = async () => {
    throw new Error('Your code did not finish running, so this test could not look inside it.');
  };
  try {
    const fn = new AsyncFunction('console', 'prompt', 'assert', body);
    const ev = (await fn(consoleObj, prompt, assert)) as (s: string) => unknown;
    evalIn = async (src) => ev(src);
  } catch (e) {
    return { inst: { stdout, evalIn }, error: toRunError(e, 2 + setup.split('\n').length) };
  }
  return { inst: { stdout, evalIn } };
}

export async function runJs(code: string, stdin: string[] = []): Promise<RunOutput> {
  try {
    // Syntax check gives a clean error before running.
    new AsyncFunction(code);
  } catch (e) {
    return { stdout: '', error: toRunError(e) };
  }
  const { inst, error } = await instantiate(code, stdin);
  // Give pending timers/promises a moment to log.
  await new Promise((r) => setTimeout(r, 50));
  return { stdout: inst.stdout.join('\n'), error };
}

/** Used inside check tests: run (modified) learner code and return its console output. */
async function rerun(src: string): Promise<string> {
  const { inst, error } = await instantiate(src);
  await new Promise((r) => setTimeout(r, 20));
  if (error) {
    const e = new Error(`Your code crashed when run with different values: ${error.type}: ${error.message}`);
    e.name = 'AssertionError';
    throw e;
  }
  return inst.stdout.join('\n');
}

export async function gradeJs(code: string, tests: Test[]): Promise<GradeResult> {
  try {
    new AsyncFunction(code);
  } catch (e) {
    return { passed: false, results: [], fatal: toRunError(e) };
  }
  const results: TestResult[] = [];
  for (const t of tests) {
    const r: TestResult = { name: t.name, explain: t.explain, passed: false };
    const setup = 'setup' in t && t.setup ? t.setup : '';
    const stdin = t.kind === 'stdout' ? t.stdin ?? [] : [];
    if (stdin.length) r.stdin = stdin;
    const { inst, error } = await instantiate(code, stdin, setup);
    await new Promise((res) => setTimeout(res, 0));
    try {
      if (t.kind === 'stdout') {
        await new Promise((res) => setTimeout(res, 30));
        r.expected = t.expected;
        r.got = inst.stdout.join('\n');
        if (error) r.error = error;
        else r.passed = norm(r.got) === norm(t.expected);
      } else if (t.kind === 'call') {
        r.expected = `${t.fn}(${t.args.map((a) => JSON.stringify(a)).join(', ')}) should return ${JSON.stringify(t.expected)}`;
        if (error) r.error = error;
        else {
          let f: unknown;
          try {
            f = await inst.evalIn(`typeof ${t.fn} === 'function' ? ${t.fn} : undefined`);
          } catch {
            f = undefined;
          }
          if (typeof f !== 'function') r.got = `There is no function called ${t.fn} in your code.`;
          else {
            const val = await (f as (...a: unknown[]) => unknown)(...t.args);
            r.got = `it returned ${val === undefined ? 'undefined' : JSON.stringify(val)}`;
            r.passed = deepEqual(val, t.expected);
          }
        }
      } else if (t.kind === 'check') {
        if (error) r.error = error;
        else {
          const out = JSON.stringify(inst.stdout.join('\n'));
          (globalThis as Record<string, unknown>).__cqRUN = rerun;
          await inst.evalIn(
            `(async () => { const OUTPUT = ${out}; const CODE = ${JSON.stringify(code)}; const RUN = globalThis.__cqRUN; ${t.code}\n})()`,
          );
          r.passed = true;
        }
      } else {
        r.got = `Test kind ${t.kind} is not supported for JavaScript.`;
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AssertionError') r.got = e.message;
      else r.error = toRunError(e);
    }
    results.push(r);
  }
  return { passed: results.length > 0 && results.every((r) => r.passed), results };
}
