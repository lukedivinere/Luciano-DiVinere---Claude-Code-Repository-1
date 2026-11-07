import { useEffect, useRef } from 'react';
import type { RunOutput } from '../engine/types';
import { setPreviewMount } from '../runners/domSandbox';
import { ErrorBox } from './ErrorBox';

export function OutputPanel({ out, running, showPreview }: { out: RunOutput | null; running: boolean; showPreview?: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showPreview) setPreviewMount(mount.current);
    return () => {
      if (showPreview) setPreviewMount(null);
    };
  }, [showPreview]);
  return (
    <div className="output">
      {showPreview && <div className="preview-mount" ref={mount} aria-label="Page preview" />}
      <div className="console" aria-live="polite">
        {running && <div className="muted">Running…</div>}
        {!running && !out && <div className="muted">Output appears here. Press ▶ Run (or Ctrl/⌘ + Enter).</div>}
        {!running && out && (
          <>
            {out.stdout && <pre className="stdout">{out.stdout}</pre>}
            {out.tables?.map((t, i) => (
              <div className="sql-table-wrap" key={i}>
                <table className="sql-table">
                  <thead>
                    <tr>{t.columns.map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r, j) => (
                      <tr key={j}>{r.map((c, k) => <td key={k}>{c === null ? 'NULL' : String(c)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
                <div className="muted small">{t.rows.length} row(s)</div>
              </div>
            ))}
            {!out.stdout && !out.tables?.length && !out.error && <div className="muted">(Your code ran but printed nothing.)</div>}
            {out.error && <ErrorBox error={out.error} />}
          </>
        )}
      </div>
    </div>
  );
}
