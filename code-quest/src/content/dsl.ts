// Small helpers that make lesson files short and consistent.
// IDs are assigned from position: <level>.learnN, <level>.pN, <level>.cN, <level>.qN.
import type { Exercise, Lang, LearnCard, Level, QuizQuestion, Test } from '../engine/types';

type ExSpec = Omit<Exercise, 'id' | 'type' | 'lang' | 'hints'> & {
  type?: Exercise['type'];
  lang?: Lang;
  hints: [string, string];
};
type LearnSpec = Omit<LearnCard, 'id'>;
type QuizSpec =
  | (Omit<Extract<QuizQuestion, { format: 'mcq' }>, 'id' | 'format' | 'concept'> & { concept?: string; format?: 'mcq' })
  | (Omit<Extract<QuizQuestion, { format: 'text' }>, 'id' | 'concept'> & { concept?: string });

export interface LevelSpec {
  id: string;
  title: string;
  kind?: Level['kind'];
  icon: string;
  summary: string;
  teaches: string[];
  requires: string[];
  lang: Lang;
  learn: LearnSpec[];
  practice?: ExSpec[];
  challenges: ExSpec[];
  quiz: QuizSpec[];
  quizMinutes?: number;
}

export function defineLevel(s: LevelSpec): Level {
  const ex = (e: ExSpec, id: string, type: Exercise['type']): Exercise => ({
    ...e,
    id,
    type: e.type ?? type,
    lang: e.lang ?? s.lang,
    hints: [{ text: e.hints[0] }, { text: e.hints[1] }],
  });
  const kind = s.kind ?? 'level';
  return {
    id: s.id,
    title: s.title,
    kind,
    icon: s.icon,
    summary: s.summary,
    teaches: s.teaches,
    requires: s.requires,
    learn: s.learn.map((l, i) => ({ ...l, id: `${s.id}.learn${i + 1}` })),
    practice: (s.practice ?? []).map((e, i) => ex(e, `${s.id}.p${i + 1}`, 'practice')),
    challenges: s.challenges.map((e, i) =>
      ex(e, `${s.id}.c${i + 1}`, kind === 'boss' ? 'boss-step' : kind === 'debug' ? 'debug' : 'challenge'),
    ),
    quiz: s.quiz.map((q, i) => {
      const concept = q.concept ?? s.teaches[0] ?? 'general';
      const id = `${s.id}.q${i + 1}`;
      if ('answers' in q) return { ...q, id, concept, format: 'text' } as QuizQuestion;
      return { ...q, id, concept, format: 'mcq' } as QuizQuestion;
    }),
    quizMinutes: s.quizMinutes ?? Math.max(1, Math.round(s.quiz.length * 0.6)),
  };
}

// ---- test helpers ----
export const out = (name: string, expected: string, explain: string, stdin?: string[], setup?: string): Test => ({
  kind: 'stdout',
  name,
  expected,
  explain,
  ...(stdin ? { stdin } : {}),
  ...(setup ? { setup } : {}),
});

export const call = (fn: string, args: unknown[], expected: unknown, explain: string, name?: string): Test => ({
  kind: 'call',
  name: name ?? `${fn}(${args.map((a) => JSON.stringify(a)).join(', ')}) returns ${JSON.stringify(expected)}`,
  fn,
  args,
  expected,
  explain,
});

export const check = (name: string, code: string, explain: string, setup?: string, stdin?: string[]): Test => ({
  kind: 'check',
  name,
  code,
  explain,
  ...(setup ? { setup } : {}),
  ...(stdin ? { stdin } : {}),
});

export const rows = (name: string, expected: (string | number | null)[][], explain: string, ordered = false): Test => ({
  kind: 'rows',
  name,
  expected,
  explain,
  ordered,
});

export const query = (name: string, sql: string, expected: (string | number | null)[][], explain: string, ordered = false): Test => ({
  kind: 'query',
  name,
  sql,
  expected,
  explain,
  ordered,
});

/** Dedent a template literal so code samples can be indented in source files.
 *  Uses the RAW text, so "\n" inside code stays as backslash-n (as the learner
 *  would type it). Write \` and \${ for a literal backtick / ${ in JS code. */
export function code(strings: TemplateStringsArray, ...vals: unknown[]): string {
  let s = strings.raw.reduce((acc, str, i) => acc + str + (i < vals.length ? String(vals[i]) : ''), '');
  s = s.replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
  s = s.replace(/^\n/, '').replace(/\n[ \t]*$/, '\n');
  const lines = s.split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^[ ]*/)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}
