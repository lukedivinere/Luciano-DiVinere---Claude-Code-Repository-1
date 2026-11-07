// SQL grading harness on top of sql.js (SQLite compiled to WebAssembly).
// Shared by sql.worker.ts and the Node validator.
import type { SqlJsStatic, QueryExecResult } from 'sql.js';
import type { GradeResult, RunError, RunOutput, Test, TestResult } from '../../engine/types';

type Cell = string | number | null;
type Table = { columns: string[]; rows: Cell[][] };

function toTables(res: QueryExecResult[]): Table[] {
  return res.map((r) => ({ columns: r.columns, rows: r.values.map((row) => row.map((c) => (c instanceof Uint8Array ? '[blob]' : c))) }));
}

function sqlError(e: unknown): RunError {
  const msg = e instanceof Error ? e.message : String(e);
  return { type: 'SQLError', message: msg };
}

function cellEq(a: Cell, b: Cell): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(a));
  return a === b;
}

function rowsEqual(got: Cell[][], exp: Cell[][], ordered: boolean): boolean {
  if (got.length !== exp.length) return false;
  const key = (r: Cell[]) => JSON.stringify(r.map((c) => (typeof c === 'number' ? Math.round(c * 1e6) / 1e6 : c)));
  if (!ordered) {
    const g = got.map(key).sort();
    const e = exp.map(key).sort();
    return g.every((x, i) => x === e[i]);
  }
  return got.every((row, i) => row.length === exp[i].length && row.every((c, j) => cellEq(c, exp[i][j])));
}

export function showRows(rows: Cell[][]): string {
  if (rows.length === 0) return '(no rows)';
  return rows.map((r) => r.map((c) => (c === null ? 'NULL' : String(c))).join(' | ')).join('\n');
}

export function runSql(SQL: SqlJsStatic, setup: string, code: string): RunOutput {
  const db = new SQL.Database();
  try {
    if (setup) db.exec(setup);
    const tables = toTables(db.exec(code));
    return { stdout: tables.length ? '' : 'Query ran. (No rows to show.)', tables };
  } catch (e) {
    return { stdout: '', error: sqlError(e) };
  } finally {
    db.close();
  }
}

export function gradeSql(SQL: SqlJsStatic, setup: string, code: string, tests: Test[]): GradeResult {
  const results: TestResult[] = [];
  for (const t of tests) {
    const r: TestResult = { name: t.name, explain: t.explain, passed: false };
    const db = new SQL.Database();
    try {
      if (setup) db.exec(setup);
      let res: QueryExecResult[];
      try {
        res = db.exec(code);
      } catch (e) {
        r.error = sqlError(e);
        results.push(r);
        continue;
      }
      if (t.kind === 'rows') {
        const last = res[res.length - 1];
        const got = last ? toTables([last])[0].rows : [];
        r.expected = showRows(t.expected);
        r.got = last ? showRows(got) : '(your code did not return any rows — is there a SELECT?)';
        r.passed = rowsEqual(got, t.expected, !!t.ordered);
      } else if (t.kind === 'query') {
        let got: Cell[][] = [];
        try {
          const q = db.exec(t.sql);
          got = q.length ? toTables([q[q.length - 1]])[0].rows : [];
          r.got = showRows(got);
        } catch (e) {
          r.got = `Checking query failed: ${(e as Error).message}`;
        }
        r.expected = showRows(t.expected);
        r.passed = r.got === showRows(got) && rowsEqual(got, t.expected, !!t.ordered);
      } else {
        r.got = `Test kind ${t.kind} is not supported for SQL.`;
      }
    } finally {
      db.close();
    }
    results.push(r);
  }
  return { passed: results.length > 0 && results.every((r) => r.passed), results };
}
