import { useState } from 'react';
import type { Level, QuizQuestion } from '../engine/types';
import { useProgress } from '../engine/store';
import { QuizQuestionCard } from './QuizQuestionCard';
import { play } from '../lib/sound';
import { burst } from '../lib/confetti';

export function QuizView({ level, onNext }: { level: Level; onNext: () => void }) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<{ q: QuizQuestion; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const rec = useProgress((s) => s.p.items[`${level.id}.quiz`]);
  const qs = level.quiz;

  if (finished) {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="quiz-done">
        <h2>Quiz complete: {score} / {qs.length}</h2>
        {score < qs.length ? (
          <p>The questions you missed are now in your <strong>Review</strong> deck — they'll come back so the idea sticks.</p>
        ) : (
          <p>Perfect score! 🎉</p>
        )}
        <div className="row">
          <button className="btn" onClick={() => { setIdx(0); setResults([]); setFinished(false); }}>
            Retake quiz
          </button>
          <button className="btn success big" onClick={onNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  const q = qs[idx];
  return (
    <div className="quiz">
      <div className="quiz-progress">
        Question {idx + 1} of {qs.length}
        {rec?.done && <span className="muted small"> · retake (no extra XP)</span>}
      </div>
      <QuizQuestionCard
        key={q.id}
        q={q}
        onAnswer={(ok) => {
          play(ok ? 'pass' : 'fail');
          setResults((r) => [...r, { q, correct: ok }]);
        }}
        nextLabel={idx + 1 < qs.length ? 'Next question →' : 'Finish quiz'}
        onNext={() => {
          if (idx + 1 < qs.length) setIdx(idx + 1);
          else {
            const all = results;
            useProgress.getState().completeQuiz(level, all);
            if (all.every((r) => r.correct)) burst(false);
            setFinished(true);
          }
        }}
      />
    </div>
  );
}
