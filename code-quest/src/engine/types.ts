// Core content + grading types. Content files (src/content/**) are plain data
// built from these types, so they can be loaded both by the app and by the
// Node validator (scripts/validate-content.ts).

export type Lang = 'python' | 'javascript' | 'sql' | 'html';

/** A single hidden test. Every test carries a plain-English `explain`
 *  that is shown when it fails. */
export type Test =
  | {
      kind: 'stdout';
      name: string;
      /** Values fed to input(), one per call (Python) / prompt() (JS). */
      stdin?: string[];
      /** Expected printed output. Trailing spaces and trailing blank lines are ignored. */
      expected: string;
      /** Python/JS run before the learner code (e.g. to fix random numbers). */
      setup?: string;
      explain: string;
    }
  | {
      kind: 'call';
      name: string;
      fn: string;
      args: unknown[];
      expected: unknown;
      setup?: string;
      explain: string;
    }
  | {
      /** Custom assertion code run after the learner code, in the same scope.
       *  Python: use `assert`. JS: use `assert(cond, msg)`; `await` allowed.
       *  Both get CODE (the learner's source) and OUTPUT (what it printed).
       *  DOM: runs inside the page, `document` available. */
      kind: 'check';
      name: string;
      code: string;
      setup?: string;
      explain: string;
    }
  | {
      /** SQL: compare the rows returned by the learner's LAST statement. */
      kind: 'rows';
      name: string;
      expected: (string | number | null)[][];
      ordered?: boolean;
      explain: string;
    }
  | {
      /** SQL: run the learner code, then this query; compare its rows. */
      kind: 'query';
      name: string;
      sql: string;
      expected: (string | number | null)[][];
      ordered?: boolean;
      explain: string;
    };

export interface Hint {
  text: string;
}

export interface Exercise {
  id: string; // unique across all content, e.g. "w1.l3.p1"
  type: 'practice' | 'challenge' | 'debug' | 'boss-step';
  title: string;
  minutes: number;
  lang: Lang;
  /** Markdown task description. */
  prompt: string;
  starter: string;
  solution: string;
  /** Why the solution works, in plain English (shown with hint 3). */
  solutionExplain: string;
  /** Exactly 3 hints: nudge, bigger clue, (solution is the 3rd tier). */
  hints: [Hint, Hint];
  tests: Test[];
  /** HTML page for DOM exercises (lang === 'javascript' with dom: true). */
  dom?: { html: string };
  /** SQL: statements that create + fill the tables before the learner code runs. */
  sqlSetup?: string;
  /** Optional default text for the stdin box when the learner presses Run. */
  sampleInput?: string[];
}

export interface LearnCard {
  id: string;
  title: string;
  minutes: number;
  /** Markdown, under 150 words. New terms in **bold** with definitions. */
  body: string;
  analogy: string;
  example: { lang: Lang; code: string; sampleInput?: string[]; dom?: { html: string }; sqlSetup?: string };
  /** Optional "Same / Different" comparison between languages. */
  compare?: { left: { lang: Lang; code: string }; right: { lang: Lang; code: string }; same: string[]; different: string[] };
}

export type QuizQuestion =
  | {
      id: string;
      kind: 'concept' | 'predict' | 'bug';
      format: 'mcq';
      concept: string;
      prompt: string;
      code?: string;
      codeLang?: Lang;
      options: string[];
      answer: number;
      explain: string;
    }
  | {
      id: string;
      kind: 'predict';
      format: 'text';
      concept: string;
      prompt: string;
      code: string;
      codeLang?: Lang;
      /** Accepted answers (compared after trimming each line). */
      answers: string[];
      explain: string;
    };

export interface Level {
  id: string; // e.g. "w1.l3"
  title: string;
  kind: 'level' | 'debug' | 'boss';
  icon: string;
  summary: string;
  teaches: string[]; // concept ids
  requires: string[]; // concept ids that must be taught earlier
  learn: LearnCard[];
  practice: Exercise[];
  challenges: Exercise[];
  quiz: QuizQuestion[];
  quizMinutes: number;
}

export interface World {
  id: string; // "w1"
  number: number;
  title: string;
  subtitle: string;
  theme: { accent: string; bg: string };
  languages: Lang[];
  minMinutes: number;
  levels: Level[];
}

/** Any completable unit inside a level, in order. */
export type ItemRef =
  | { kind: 'learn'; id: string; minutes: number; card: LearnCard }
  | { kind: 'exercise'; id: string; minutes: number; ex: Exercise }
  | { kind: 'quiz'; id: string; minutes: number; questions: QuizQuestion[] };

// ----- Grading results -----
export interface TestResult {
  name: string;
  passed: boolean;
  explain: string;
  expected?: string;
  got?: string;
  stdin?: string[];
  error?: RunError;
}

export interface RunError {
  type: string;
  message: string;
  line?: number;
  /** Plain-English translation + hint. Filled in by errorTranslator. */
  friendly?: { title: string; meaning: string; hint: string };
}

export interface RunOutput {
  stdout: string;
  error?: RunError;
  /** For SQL runs: result tables. */
  tables?: { columns: string[]; rows: (string | number | null)[][] }[];
  timedOut?: boolean;
}

export interface GradeResult {
  passed: boolean;
  results: TestResult[];
  /** Error that stopped the code before any test could run (syntax error, timeout). */
  fatal?: RunError;
  timedOut?: boolean;
}
