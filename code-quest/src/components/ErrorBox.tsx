import type { RunError } from '../engine/types';

export function ErrorBox({ error }: { error: RunError }) {
  const f = error.friendly;
  return (
    <div className="error-box" role="alert">
      <div className="error-title">🛑 {f?.title ?? error.type}</div>
      {f && <p className="error-meaning">{f.meaning}</p>}
      {f && (
        <p className="error-hint">
          <strong>Try this:</strong> {f.hint}
        </p>
      )}
      <details>
        <summary>Original error message</summary>
        <code>
          {error.type}: {error.message}
          {error.line ? ` (line ${error.line})` : ''}
        </code>
      </details>
    </div>
  );
}
