// Grades exercises in Node using the SAME harnesses as the browser app:
// Python via the pyodide npm package, JS via jsHarness, SQL via sql.js,
// DOM exercises via jsdom.
import { loadPyodide } from 'pyodide';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { JSDOM, VirtualConsole } from 'jsdom';
import { PY_HARNESS } from '../src/runners/harness/pyHarness';
import { gradeJs } from '../src/runners/harness/jsHarness';
import { gradeSql } from '../src/runners/harness/sqlHarness';
import { buildDomDoc, type DomPayload } from '../src/runners/harness/domHarness';
import type { Exercise, GradeResult, Lang, RunError, Test } from '../src/engine/types';

type Py = Awaited<ReturnType<typeof loadPyodide>>;
let py: Py | null = null;
let SQL: SqlJsStatic | null = null;

async function getPy(): Promise<Py> {
  if (!py) {
    py = await loadPyodide();
    py.runPython(PY_HARNESS);
  }
  return py;
}

async function getSql(): Promise<SqlJsStatic> {
  if (!SQL) SQL = await initSqlJs();
  return SQL;
}

function gradeDom(html: string, code: string, tests: Test[]): Promise<GradeResult> {
  const { doc } = buildDomDoc(html, code, tests);
  return new Promise((resolve) => {
    const vc = new VirtualConsole();
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) resolve({ passed: false, results: [], fatal: { type: 'Timeout', message: 'DOM run timed out' } });
    }, 5000);
    const dom = new JSDOM(doc, {
      runScripts: 'dangerously',
      virtualConsole: vc,
      beforeParse(window) {
        (window as unknown as { __cqReport: (p: DomPayload) => void }).__cqReport = (p) => {
          finished = true;
          clearTimeout(timer);
          if (p.error && !(p.results ?? []).length) {
            resolve({ passed: false, results: [], fatal: p.error });
          } else {
            const results = tests.map((t, i) => ({
              name: t.name,
              explain: t.explain,
              passed: !!p.results?.[i]?.passed,
              got: p.results?.[i]?.got,
              error: p.results?.[i]?.error as RunError | undefined,
            }));
            resolve({ passed: results.length > 0 && results.every((r) => r.passed), results });
          }
          setTimeout(() => dom.window.close(), 0);
        };
      },
    });
    // jsdom reports uncaught script errors as jsdomError; the page's own
    // 'error' listener records them, so nothing else to do here.
    vc.on('jsdomError', () => {});
  });
}

export async function gradeNode(
  lang: Lang,
  code: string,
  tests: Test[],
  opts: { dom?: { html: string }; sqlSetup?: string } = {},
): Promise<GradeResult> {
  if (lang === 'python') {
    const p = await getPy();
    const fn = p.globals.get('cq_grade');
    const raw = JSON.parse(fn(code, JSON.stringify(tests)));
    fn.destroy?.();
    const results = raw.results as GradeResult['results'];
    return { passed: !raw.fatal && results.length > 0 && results.every((r) => r.passed), results, fatal: raw.fatal ?? undefined };
  }
  if (lang === 'sql') return gradeSql(await getSql(), opts.sqlSetup ?? '', code, tests);
  if (opts.dom) return gradeDom(opts.dom.html, code, tests);
  return gradeJs(code, tests);
}

export function gradeExerciseNode(ex: Exercise, code: string) {
  return gradeNode(ex.lang, code, ex.tests, { dom: ex.dom, sqlSetup: ex.sqlSetup });
}

/** Python `run` (not grade) — used to check Learn examples execute without errors. */
export async function runPythonNode(code: string, stdin: string[] = []): Promise<{ stdout: string; error: RunError | null }> {
  const p = await getPy();
  const fn = p.globals.get('cq_run');
  const out = JSON.parse(fn(code, JSON.stringify(stdin)));
  fn.destroy?.();
  return out;
}
