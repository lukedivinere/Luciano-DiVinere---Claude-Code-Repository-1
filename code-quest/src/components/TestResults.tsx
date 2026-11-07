import type { GradeResult } from '../engine/types';
import { ErrorBox } from './ErrorBox';

export function TestResults({ result }: { result: GradeResult }) {
  if (result.fatal) {
    return (
      <div className="tests">
        <div className="tests-summary fail">Your code couldn't run, so no tests were checked.</div>
        <ErrorBox error={result.fatal} />
      </div>
    );
  }
  const passed = result.results.filter((r) => r.passed).length;
  return (
    <div className="tests">
      <div className={`tests-summary ${result.passed ? 'pass' : 'fail'}`}>
        {result.passed ? '✅ All tests passed!' : `${passed} of ${result.results.length} tests passed`}
      </div>
      <ul className="test-list">
        {result.results.map((r, i) => (
          <li key={i} className={r.passed ? 'pass' : 'fail'}>
            <div className="test-name">
              {r.passed ? '✔' : '✘'} {r.name}
            </div>
            {!r.passed && (
              <div className="test-detail">
                <p>{r.explain}</p>
                {r.stdin && r.stdin.length > 0 && (
                  <div className="kv">
                    <span>Input typed:</span> <code>{r.stdin.join(' ⏎ ')}</code>
                  </div>
                )}
                {r.expected !== undefined && !r.error && (
                  <div className="kv">
                    <span>Expected:</span> <pre>{r.expected || '(nothing)'}</pre>
                  </div>
                )}
                {r.got !== undefined && !r.error && (
                  <div className="kv">
                    <span>Got:</span> <pre>{r.got || '(nothing)'}</pre>
                  </div>
                )}
                {r.error && <ErrorBox error={r.error} />}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
