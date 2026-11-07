/// <reference lib="webworker" />
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { gradeSql, runSql } from './harness/sqlHarness';

let SQL: SqlJsStatic | null = null;

self.onmessage = async (ev: MessageEvent) => {
  const { id, type, base, code, setup, tests } = ev.data;
  try {
    if (!SQL) SQL = await initSqlJs({ locateFile: (f: string) => `${base}sqljs/${f}` });
    const data = type === 'run' ? runSql(SQL, setup ?? '', code) : gradeSql(SQL, setup ?? '', code, tests);
    self.postMessage({ id, ok: true, data });
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e as Error)?.message ?? e) });
  }
};
