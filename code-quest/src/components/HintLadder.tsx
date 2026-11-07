import type { Exercise } from '../engine/types';
import { HINT_PENALTY } from '../engine/xp';
import { Markdown } from './Markdown';
import { Editor } from './Editor';

interface Props {
  ex: Exercise;
  used: number;
  done: boolean;
  onReveal: (tier: number) => void;
  onUseSolution: () => void;
}

const LABELS = ['Nudge', 'Bigger clue', 'Full solution'];

export function HintLadder({ ex, used, done, onReveal, onUseSolution }: Props) {
  const next = used + 1;
  return (
    <div className="hints">
      <div className="hints-head">
        <strong>💡 Hints</strong>
        <span className="muted small">Hints never block you — they just lower the XP for this item.</span>
      </div>
      {ex.hints.map((h, i) =>
        used > i ? (
          <div className="hint" key={i}>
            <div className="hint-label">Hint {i + 1} · {LABELS[i]}</div>
            <Markdown text={h.text} />
          </div>
        ) : null,
      )}
      {used >= 3 && (
        <div className="hint solution">
          <div className="hint-label">Solution · with explanation</div>
          <div className="solution-code">
            <Editor value={ex.solution} lang={ex.lang} readOnly minimal />
          </div>
          <Markdown text={ex.solutionExplain} />
          <button className="btn ghost small" onClick={onUseSolution}>
            Copy into my editor
          </button>
          <p className="muted small">Tip: type it out yourself instead of copying — your fingers learn too.</p>
        </div>
      )}
      {next <= 3 && (
        <button className="btn hint-btn" onClick={() => onReveal(next)}>
          {next === 3 ? '🔓 Show solution' : `💡 Hint ${next}: ${LABELS[next - 1]}`}
          {!done && <span className="penalty"> (−{Math.round(HINT_PENALTY[next] * 100)}% XP)</span>}
        </button>
      )}
    </div>
  );
}
