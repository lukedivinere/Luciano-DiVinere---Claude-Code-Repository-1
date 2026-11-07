import { useEffect, useState } from 'react';
import type { Exercise, GradeResult, Level, RunOutput } from '../engine/types';
import { useProgress } from '../engine/store';
import { gradeExercise, runCode } from '../runners/runner';
import { exerciseXp } from '../engine/xp';
import { Editor } from './Editor';
import { Markdown } from './Markdown';
import { TestResults } from './TestResults';
import { HintLadder } from './HintLadder';
import { OutputPanel } from './OutputPanel';
import { PyStatus } from './PyStatus';
import { play } from '../lib/sound';
import { burst } from '../lib/confetti';

const TYPE_LABEL: Record<Exercise['type'], string> = {
  practice: '✏️ Practice',
  challenge: '⚔️ Challenge',
  debug: '🐞 Debug Mode',
  'boss-step': '🐉 Boss Step',
};

export function ExerciseView({ ex, level, onNext }: { ex: Exercise; level: Level; onNext: () => void }) {
  const p = useProgress((s) => s.p);
  const { saveCode, submitExercise, revealHint } = useProgress.getState();
  const record = p.items[ex.id];
  const done = !!record?.done;
  const [code, setCode] = useState(p.code[ex.id] ?? ex.starter);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [out, setOut] = useState<RunOutput | null>(null);
  const [busy, setBusy] = useState<'run' | 'check' | null>(null);
  const [tab, setTab] = useState<'task' | 'results'>('task');
  const [stdin, setStdin] = useState((ex.sampleInput ?? []).join('\n'));
  const usesInput = ex.lang === 'python' && /\binput\s*\(/.test(code);

  useEffect(() => {
    setCode(useProgress.getState().p.code[ex.id] ?? ex.starter);
    setResult(null);
    setOut(null);
    setTab('task');
    setStdin((ex.sampleInput ?? []).join('\n'));
  }, [ex.id, ex.starter, ex.sampleInput]);

  const onChange = (v: string) => {
    setCode(v);
    saveCode(ex.id, v);
  };

  const run = async () => {
    play('click');
    setBusy('run');
    setOut(await runCode(ex.lang, code, { stdin: stdin === '' ? [] : stdin.split('\n'), dom: ex.dom, sqlSetup: ex.sqlSetup }));
    setBusy(null);
  };

  const check = async () => {
    setBusy('check');
    const res = await gradeExercise(ex, code);
    setResult(res);
    setTab('results');
    setBusy(null);
    const gained = submitExercise(ex, level, res.passed);
    if (res.passed) {
      play('pass');
      if (gained) burst(false);
    } else play('fail');
  };

  const hintsUsed = record?.hintsUsed ?? 0;
  const potential = exerciseXp(ex.type, hintsUsed, (record?.attempts ?? 0) === 0);
  const errLine = (result?.fatal?.line ?? out?.error?.line) || undefined;

  return (
    <div className="exercise">
      <section className="ex-left">
        <header className="ex-head">
          <span className={`tag tag-${ex.type}`}>{TYPE_LABEL[ex.type]}</span>
          <span className="tag">⏱ {ex.minutes} min</span>
          <span className="tag lang">{ex.lang === 'javascript' ? 'JavaScript' : ex.lang === 'sql' ? 'SQL' : 'Python'}</span>
          {done ? <span className="tag done">✓ Done · +{record?.xp} XP</span> : <span className="tag xp">up to +{potential} XP</span>}
        </header>
        <h2>{ex.title}</h2>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'task'} className={tab === 'task' ? 'on' : ''} onClick={() => setTab('task')}>
            Task
          </button>
          <button role="tab" aria-selected={tab === 'results'} className={tab === 'results' ? 'on' : ''} onClick={() => setTab('results')} disabled={!result}>
            Test results {result ? (result.passed ? '✅' : '❌') : ''}
          </button>
        </div>
        <div className="ex-scroll">
          {tab === 'task' ? (
            <>
              <Markdown text={ex.prompt} />
              {ex.sqlSetup && <SchemaPeek setup={ex.sqlSetup} />}
              <HintLadder
                ex={ex}
                used={hintsUsed}
                done={done}
                onReveal={(t) => revealHint(ex.id, t)}
                onUseSolution={() => onChange(ex.solution)}
              />
            </>
          ) : result ? (
            <TestResults result={result} />
          ) : null}
        </div>
        {(done || result?.passed) && (
          <div className="ex-next">
            <button className="btn success big" onClick={onNext}>
              Continue →
            </button>
          </div>
        )}
      </section>
      <section className="ex-right">
        <div className="ex-editor">
          <Editor value={code} lang={ex.lang} onChange={onChange} onRun={check} errorLine={errLine} />
        </div>
        <div className="toolbar">
          <button className="btn" onClick={run} disabled={!!busy} title="Run your code and see the output">
            ▶ Run
          </button>
          <button className="btn primary" onClick={check} disabled={!!busy} title="Run the hidden tests (Ctrl/⌘ + Enter)">
            {busy === 'check' ? 'Checking…' : '✔ Check answer'}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              if (confirm('Reset your code to the starting code?')) onChange(ex.starter);
            }}
          >
            ↺ Reset
          </button>
          <PyStatus lang={ex.lang} />
        </div>
        {usesInput && (
          <label className="stdin">
            <span>Input for ▶ Run (one per line):</span>
            <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={2} spellCheck={false} />
          </label>
        )}
        <OutputPanel out={out} running={busy === 'run'} showPreview={!!ex.dom} />
      </section>
    </div>
  );
}

function SchemaPeek({ setup }: { setup: string }) {
  const creates = setup.match(/CREATE TABLE[^;]+;/gi) ?? [];
  return (
    <details className="schema" open>
      <summary>🗄️ Tables in this database</summary>
      <pre>{creates.join('\n')}</pre>
    </details>
  );
}
