import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WORLDS } from '../content/registry';
import { useProgress } from '../engine/store';
import { dueCards, MASTERED_BOX } from '../engine/srs';
import { QuizQuestionCard } from '../components/QuizQuestionCard';
import type { QuizQuestion } from '../engine/types';
import { CONCEPTS } from '../content/concepts';
import { play } from '../lib/sound';

const QUESTIONS: Record<string, QuizQuestion> = Object.fromEntries(
  WORLDS.flatMap((w) => w.levels.flatMap((l) => l.quiz.map((q) => [q.id, q]))),
);

export function Review() {
  const p = useProgress((s) => s.p);
  // Snapshot the due list when the session starts so answered cards don't jump around.
  const [session, setSession] = useState<string[] | null>(null);
  const [pos, setPos] = useState(0);
  const [score, setScore] = useState(0);
  const due = useMemo(() => dueCards(p.srs, Date.now()).filter((id) => QUESTIONS[id]), [p.srs]);
  const cards = Object.entries(p.srs).filter(([id]) => QUESTIONS[id]);
  const weak = [...new Set(cards.filter(([, c]) => c.box < MASTERED_BOX).map(([, c]) => c.concept))];

  if (session && pos < session.length) {
    const q = QUESTIONS[session[pos]];
    return (
      <div className="page review">
        <h1>🔁 Review</h1>
        <div className="quiz-progress">
          Card {pos + 1} of {session.length} · concept: <strong>{CONCEPTS[q.concept] ?? q.concept}</strong>
        </div>
        <QuizQuestionCard
          key={q.id + pos}
          q={q}
          onAnswer={(ok) => {
            play(ok ? 'pass' : 'fail');
            if (ok) setScore((s) => s + 1);
            useProgress.getState().answerReview(q, ok);
          }}
          onNext={() => setPos(pos + 1)}
          nextLabel={pos + 1 < session.length ? 'Next card →' : 'Finish'}
        />
      </div>
    );
  }

  return (
    <div className="page review">
      <h1>🔁 Review</h1>
      <p className="muted">
        Questions you missed come back here on a schedule (spaced repetition): right away, then after 1, 2, 4, 7 and 14 days each time you get them right.
        Miss one and it starts over. This is the fastest way to make ideas stick.
      </p>
      {session && (
        <div className="feedback pass">
          Session done: {score} / {session.length} correct.
        </div>
      )}
      {due.length > 0 ? (
        <button
          className="btn primary big"
          onClick={() => {
            setSession(due.slice(0, 15));
            setPos(0);
            setScore(0);
          }}
        >
          Start review ({Math.min(15, due.length)} card{due.length === 1 ? '' : 's'} due)
        </button>
      ) : (
        <div className="empty">
          {cards.length === 0 ? (
            <>Nothing to review yet. Miss a quiz question and it'll show up here. <Link to="/">Back to the map →</Link></>
          ) : (
            <>All caught up! 🎉 Come back later — the next cards are scheduled.</>
          )}
        </div>
      )}
      {cards.length > 0 && (
        <div className="boxes">
          {[1, 2, 3, 4, 5, 6].map((b) => (
            <div key={b} className="box">
              <div className="box-n">{cards.filter(([, c]) => c.box === b).length}</div>
              <div className="small muted">Box {b}</div>
            </div>
          ))}
        </div>
      )}
      {weak.length > 0 && (
        <div className="weak">
          <h3>Concepts to strengthen</h3>
          <div className="chips">{weak.map((c) => <span key={c} className="chip">{CONCEPTS[c] ?? c}</span>)}</div>
        </div>
      )}
    </div>
  );
}
