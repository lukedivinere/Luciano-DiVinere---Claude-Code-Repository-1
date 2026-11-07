# ⚔️ Code Quest

A game that teaches you to code from total beginner to expert — **Python** first, then **JavaScript** side by side, then **SQL**. Everything runs in your browser: no backend, no account, works offline after install.

- **3 worlds, ~870 minutes of real work** (World 1: 200 min · World 2: 306 min · World 3: 364 min)
- **168 auto-graded exercises** with hidden tests, plain-English failure explanations, and 3-tier hints
- Every level: **Learn → Practice → Challenge → Quiz**, and every world ends in a multi-step **Boss Battle**
- XP, levels, ranks, streaks, badges, spaced-repetition review, Debug Mode, Free Code sandbox and a progress dashboard

## Run it

You need **Node.js 18 or newer** (check with `node -v`).

```bash
cd code-quest
```

```bash
npm install
```

```bash
npm run dev
```

Then open **http://localhost:5173** in Chrome, Edge or Firefox.

`npm install` also copies the Python runtime (Pyodide, ~15 MB) and SQLite (sql.js) into `public/`, so after that the app works with no internet connection. The first time you run Python it takes a few seconds to start; after that it's fast.

**On a Mac, no Terminal typing needed after the first install:** double-click **`Start Code Quest.command`** in the `code-quest` folder. It starts the game and opens it in your browser. Keep the Terminal window it opens; close it to stop the game. (First time only: if macOS says it can't verify the file, right-click it → **Open** → **Open**.) To start the game automatically when you log in, add that file in **System Settings → General → Login Items → +**.

To build a static version you can open from any web server:

```bash
npm run build
```

```bash
npm run preview
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Browser says **"localhost refused to connect"** | The game only runs while `npm run dev` is running in a Terminal window. Start it again and keep the window open. |
| `npm install` fails with **`EACCES`** / "cache folder contains root-owned files" | Run `sudo chown -R $(id -u):$(id -g) ~/.npm` (asks for your Mac password; typing shows nothing), then `npm install` again. Or skip it with `npm install --cache ~/npm-cache-temp`. |
| `npm install` says **"N vulnerabilities"** | Safe to ignore for a game that runs only on your own computer. Don't run `npm audit fix --force`; it can upgrade tools to incompatible versions. |
| npm warns **"install scripts not yet covered by allowScripts"** | Fine to ignore. `npm run dev` copies the Python runtime itself. If `npm run dev` then errors about **esbuild**, run `npm rebuild esbuild`. |
| Python never finishes loading | Run `node scripts/copy-assets.mjs`, then restart `npm run dev`. |

## Your progress

Progress is saved automatically in your browser (`localStorage`): XP, completed items, streak, badges, review cards, time spent and the code you wrote for every exercise. Use **⚙️ Settings → Export backup** to move it to another browser or computer, and **Import backup** to restore it.

## How the game works

| Mechanic | Rule |
|---|---|
| XP | Lesson 10 · Practice 15 · Challenge / Debug 50 · Boss step 75 · Quiz 5 per correct answer · Boss defeated +150 |
| Bonuses | +25% for passing on the first try, +25% for using no hints |
| Hints | Nudge (−10% XP) → Bigger clue (−25%) → Full solution with explanation (−50%). Never blocks progress. |
| Unlocks | Items inside a level unlock in order; levels unlock in order; a world opens when the previous world's Boss is beaten |
| Ranks | Script Kiddie → Code Cadet (300 XP) → Junior Dev (1,000) → Developer (2,500) → Senior Dev (5,000) → Staff Engineer (8,000) → Architect (12,000) |
| Streak | Days in a row with at least one completed item |
| Review | Quiz questions you miss come back after 0, 1, 2, 4, 7 and 14 days (Leitner boxes); a miss restarts the card |

## Checks (for developers)

| Command | What it does |
|---|---|
| `npm run validate` | Runs **every** exercise's reference solution against its hidden tests in Node (Pyodide, sql.js, jsdom), checks every starter **fails**, checks each level only requires concepts taught earlier, checks quizzes, word counts and world lengths. ~3 min. |
| `npm run e2e:grade` | Grades every solution and starter again **inside real Chromium**, through the same Web Workers / sandboxed iframe the app uses. ~5 min. |
| `npm run e2e` | Playwright smoke test of the UI: map, lessons, grading, hints, timeouts, saving, sandbox. |
| `npm test` | Unit tests for the game engine (XP, ranks, unlocks, streaks, review scheduling, save migration). |
| `npm run typecheck` | TypeScript check. |

`npm run validate -- --only=w2.l3` checks one level (any id prefix works, e.g. `--only=w3.`).

The e2e scripts use Playwright with Chromium. If Playwright isn't installed globally: `npm install -D playwright` then `npx playwright install chromium`.

## Project layout

```
code-quest/
  src/
    content/                 ← all lessons live here
      registry.ts            ← ordered list of worlds
      concepts.ts            ← every concept id the curriculum can teach
      dsl.ts                 ← helpers: defineLevel, out, call, check, rows, query, code
      sandboxDb.ts           ← sample shop database (SQL sandbox + SQL levels)
      world1-beginner/       ← index.ts + levels/01-hello.ts …
      world2-intermediate/
      world3-expert/
    engine/                  ← XP, ranks, unlocks, streak, review, badges, saving
    runners/                 ← Python/JS/SQL workers, DOM iframe, error translator
      harness/               ← grading code shared by the browser AND the validator
    components/ screens/     ← React UI
  scripts/validate-content.ts
  tests/engine/              ← Vitest unit tests
  tests/e2e/                 ← Playwright scripts
```

## Adding a new level

1. Create a file in the world's `levels/` folder, e.g. `src/content/world1-beginner/levels/14-tuples.ts`:

```ts
import { call, check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w1.l14',                 // unique and stable — progress is saved by id
  title: 'Tuples',
  icon: '📌',
  summary: 'Lists that can\'t change',
  lang: 'python',               // default language for every exercise in the level
  teaches: ['tuples'],          // add new ids to src/content/concepts.ts
  requires: ['lists'],          // must already be taught by an EARLIER level
  learn: [
    {
      title: 'Frozen lists',
      minutes: 3,
      analogy: 'A tuple is a **sealed envelope**: you can read it, but not change it.',
      body: 'A **tuple** is ... (markdown, under 150 words, bold new terms)',
      example: { lang: 'python', code: code`
        point = (3, 4)
        print(point[0])
      ` },
    },
  ],
  practice: [ /* 2–4 exercises, same shape as challenges */ ],
  challenges: [
    {
      title: 'Swap a pair',
      minutes: 4,
      prompt: 'Write `swap(pair)` that returns the pair reversed.',
      starter: 'def swap(pair):\n    pass\n',
      solution: 'def swap(pair):\n    return (pair[1], pair[0])\n',
      solutionExplain: 'Build a new tuple from the two items in the other order.',
      hints: ['Index 0 and 1 give the two items.', '`return (pair[1], pair[0])`'],
      tests: [
        call('swap', [[1, 2]], [2, 1], 'swap((1, 2)) should return (2, 1).'),
      ],
    },
  ],
  quiz: [
    // 3–5 questions; include at least one kind: 'predict' and one kind: 'bug'
    { kind: 'predict', format: 'text', prompt: 'What does this print?', code: 'print((1, 2)[1])', answers: ['2'], explain: '...' },
    { kind: 'bug', prompt: '...', code: '...', options: ['A', 'B', 'C'], answer: 1, explain: '...' },
    { kind: 'concept', prompt: '...', options: ['A', 'B'], answer: 0, explain: '...' },
  ],
});
```

2. Import it in the world's `index.ts` and add it to `levels` (order = unlock order; keep the boss last).
3. Run `npm run validate -- --only=w1.l14`. It tells you if the solution fails, the starter passes, a concept is used before it's taught, or the quiz is missing a question type.

**Test helpers** (all take a plain-English `explain` shown when the test fails):

| Helper | Use |
|---|---|
| `out(name, expected, explain, stdin?, setup?)` | Compare printed output. `stdin` feeds `input()` (Python). |
| `call(fn, args, expected, explain)` | Call a function and compare its return value. |
| `check(name, code, explain, setup?, stdin?)` | Custom assertions run after the learner's code. Python: `assert`; JS: `assert(cond, msg)` and `await`; DOM: `click('#id')`, `typeInto('#id', 'text')`, `submitForm('#form')`, `textOf('#id')`. Also available: `CODE` (learner source), `OUTPUT`, and `RUN(src)` to re-run modified code. |
| `rows(name, expectedRows, explain, ordered?)` | SQL: compare the rows from the learner's last statement. |
| `query(name, sql, expectedRows, explain, ordered?)` | SQL: run your own query after the learner's code. |

Per-exercise options: `lang` (`'python' \| 'javascript' \| 'sql'`), `type: 'debug'` (🐞 Debug Mode), `dom: { html }` (JS exercise on a web page), `sqlSetup` (tables + data), `sampleInput` (pre-filled Run input).

Tip: write code samples with the `code` template tag so you can indent them naturally; it keeps `\n` as typed.

## Adding World 4 (and beyond)

1. Create `src/content/world4-<name>/index.ts` exporting a `World` (copy `world3-expert/index.ts`) with `id: 'w4'`, `number: 4`, a `minMinutes`, theme colors and its `levels`.
2. End it with at least one level of `kind: 'boss'` — beating it unlocks World 5.
3. Add it to `WORLDS` in `src/content/registry.ts`.
4. Run `npm run validate`. It also checks that each world is **longer than the one before**.

The map, unlocks, dashboard, review deck and badges pick up new worlds automatically.
