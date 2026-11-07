import { useState } from 'react';
import type { LearnCard, Level } from '../engine/types';
import { useProgress } from '../engine/store';
import { Markdown } from './Markdown';
import { CodeRunner } from './CodeRunner';
import { Editor } from './Editor';
import { play } from '../lib/sound';

const LANG_NAME = { python: 'Python', javascript: 'JavaScript', sql: 'SQL', html: 'HTML' };

export function LearnView({ card, level, onNext }: { card: LearnCard; level: Level; onNext: () => void }) {
  const key = `learn:${card.id}`;
  const saved = useProgress((s) => s.p.code[key]);
  const done = useProgress((s) => !!s.p.items[card.id]?.done);
  const [code, setCode] = useState(saved ?? card.example.code);

  return (
    <div className="learn">
      <section className="learn-text">
        <header className="ex-head">
          <span className="tag tag-learn">📖 Learn</span>
          <span className="tag">⏱ {card.minutes} min</span>
        </header>
        <h2>{card.title}</h2>
        <div className="analogy">
          <span className="analogy-icon">💭</span>
          <Markdown text={card.analogy} />
        </div>
        <Markdown text={card.body} />
        {card.compare && (
          <div className="compare">
            <div className="compare-cols">
              {[card.compare.left, card.compare.right].map((side, i) => (
                <div key={i} className="compare-col">
                  <div className="compare-lang">{LANG_NAME[side.lang]}</div>
                  <div className="compare-code">
                    <Editor value={side.code} lang={side.lang} readOnly minimal />
                  </div>
                </div>
              ))}
            </div>
            <div className="same-diff">
              <div>
                <strong>🟰 Same</strong>
                <ul>{card.compare.same.map((s, i) => <li key={i}><Markdown text={s} /></li>)}</ul>
              </div>
              <div>
                <strong>↔️ Different</strong>
                <ul>{card.compare.different.map((s, i) => <li key={i}><Markdown text={s} /></li>)}</ul>
              </div>
            </div>
          </div>
        )}
        <div className="ex-next">
          <button
            className="btn success big"
            onClick={() => {
              if (!done) {
                play('xp');
                useProgress.getState().completeLearn(card.id, level);
              }
              onNext();
            }}
          >
            {done ? 'Continue →' : 'Got it! (+10 XP) →'}
          </button>
        </div>
      </section>
      <section className="learn-code">
        <div className="learn-code-head">
          Try it: edit the example and press <kbd>▶ Run</kbd>. Break it on purpose — you can't hurt anything.
        </div>
        <CodeRunner
          lang={card.example.lang}
          code={code}
          onChange={(c) => {
            setCode(c);
            useProgress.getState().saveCode(key, c);
          }}
          onReset={() => {
            setCode(card.example.code);
            useProgress.getState().saveCode(key, card.example.code);
          }}
          sampleInput={card.example.sampleInput}
          dom={card.example.dom}
          sqlSetup={card.example.sqlSetup}
        />
      </section>
    </div>
  );
}
