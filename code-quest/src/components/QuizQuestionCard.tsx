import { useState } from 'react';
import type { QuizQuestion } from '../engine/types';
import { Markdown } from './Markdown';

const KIND_LABEL = { concept: '🧠 Concept', predict: '🔮 Predict the output', bug: '🐞 Spot the bug' };

export function normalizeAnswer(s: string) {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l, i, a) => l !== '' || i < a.length - 1)
    .join('\n')
    .trim()
    .toLowerCase();
}

export function isCorrect(q: QuizQuestion, answer: number | string): boolean {
  if (q.format === 'mcq') return answer === q.answer;
  const a = normalizeAnswer(String(answer));
  return q.answers.some((x) => normalizeAnswer(x) === a);
}

/** One quiz question. Calls onAnswer once the learner checks it. */
export function QuizQuestionCard({ q, onAnswer, onNext, nextLabel }: { q: QuizQuestion; onAnswer: (correct: boolean) => void; onNext: () => void; nextLabel: string }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [checked, setChecked] = useState<boolean | null>(null);

  const check = () => {
    const ok = isCorrect(q, q.format === 'mcq' ? (choice ?? -1) : text);
    setChecked(ok);
    onAnswer(ok);
  };

  return (
    <div className="quiz-card">
      <div className="tag">{KIND_LABEL[q.kind]}</div>
      <Markdown text={q.prompt} className="quiz-prompt" />
      {q.code && <pre className="code-block">{q.code}</pre>}
      {q.format === 'mcq' ? (
        <div className="options" role="radiogroup">
          {q.options.map((o, i) => {
            const state = checked === null ? '' : i === q.answer ? 'right' : i === choice ? 'wrong' : '';
            return (
              <button
                key={i}
                role="radio"
                aria-checked={choice === i}
                className={`option ${choice === i ? 'chosen' : ''} ${state}`}
                disabled={checked !== null}
                onClick={() => setChoice(i)}
              >
                <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                <Markdown text={o} className="opt-text" />
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          className="predict-input"
          placeholder="Type exactly what the program prints…"
          value={text}
          rows={3}
          disabled={checked !== null}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      )}
      {checked === null ? (
        <button className="btn primary" disabled={q.format === 'mcq' ? choice === null : !text.trim()} onClick={check}>
          Check
        </button>
      ) : (
        <div className={`feedback ${checked ? 'pass' : 'fail'}`}>
          <strong>{checked ? '✅ Correct!' : '❌ Not quite.'}</strong>
          {!checked && q.format === 'text' && (
            <div>
              Answer: <pre className="inline-pre">{q.answers[0]}</pre>
            </div>
          )}
          <Markdown text={q.explain} />
          <button className="btn primary" onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
