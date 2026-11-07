// Editor + Run button + output. Used for Learn examples and the sandbox.
import { useState } from 'react';
import type { Lang, RunOutput } from '../engine/types';
import { runCode } from '../runners/runner';
import { Editor } from './Editor';
import { OutputPanel } from './OutputPanel';
import { PyStatus } from './PyStatus';
import { play } from '../lib/sound';

interface Props {
  lang: Lang;
  code: string;
  onChange: (c: string) => void;
  sampleInput?: string[];
  dom?: { html: string };
  sqlSetup?: string;
  onReset?: () => void;
  layout?: 'stack' | 'split';
}

export function CodeRunner({ lang, code, onChange, sampleInput, dom, sqlSetup, onReset, layout = 'stack' }: Props) {
  const [out, setOut] = useState<RunOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState((sampleInput ?? []).join('\n'));
  const usesInput = lang === 'python' && /\binput\s*\(/.test(code);

  const run = async () => {
    play('click');
    setRunning(true);
    const res = await runCode(lang, code, { stdin: stdin === '' ? [] : stdin.split('\n'), dom, sqlSetup });
    setOut(res);
    setRunning(false);
  };

  return (
    <div className={`runner runner-${layout}`}>
      <div className="runner-editor">
        <Editor value={code} lang={lang} onChange={(v) => { onChange(v); }} onRun={run} errorLine={out?.error?.line} />
      </div>
      <div className="runner-side">
        <div className="toolbar">
          <button className="btn primary" onClick={run} disabled={running}>
            ▶ Run
          </button>
          {onReset && (
            <button className="btn ghost" onClick={onReset} title="Put the original code back">
              ↺ Reset
            </button>
          )}
          <PyStatus lang={lang} />
        </div>
        {usesInput && (
          <label className="stdin">
            <span>Input for input() — one answer per line:</span>
            <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={2} spellCheck={false} />
          </label>
        )}
        <OutputPanel out={out} running={running} showPreview={!!dom} />
      </div>
    </div>
  );
}
