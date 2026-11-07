// Content validator. For every exercise in every world it checks that:
//   1. the reference solution PASSES all of its hidden tests;
//   2. the starter code FAILS at least one test (so the learner must write code);
//   3. every level only requires concepts taught by itself or earlier levels;
//   4. ids are unique, quizzes are well formed, explanations are short;
//   5. world minutes meet the minimum and each world is longer than the last;
//   6. Python Learn examples run without crashing.
// Run: npm run validate   (add --only=w1.l3 to check one level)
import { WORLDS } from '../src/content/registry';
import { CONCEPTS } from '../src/content/concepts';
import { levelMinutes, worldMinutes } from '../src/engine/content';
import { gradeExerciseNode, runPythonNode } from './nodeGrader';
import type { Exercise, GradeResult } from '../src/engine/types';

const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const errors: string[] = [];
const warnings: string[] = [];
let checked = 0;

function describe(r: GradeResult): string {
  if (r.fatal) return `fatal ${r.fatal.type}: ${r.fatal.message} (line ${r.fatal.line ?? '?'})`;
  return r.results
    .filter((x) => !x.passed)
    .map((x) => `    ✘ ${x.name}\n      expected: ${JSON.stringify(x.expected)}\n      got: ${JSON.stringify(x.got)}${x.error ? `\n      error: ${x.error.type}: ${x.error.message} (line ${x.error.line ?? '?'})` : ''}`)
    .join('\n');
}

function wordCount(md: string) {
  return md.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
}

const ids = new Set<string>();
const dup = (id: string) => {
  if (ids.has(id)) errors.push(`Duplicate id ${id}`);
  ids.add(id);
};

async function checkExercise(ex: Exercise) {
  dup(ex.id);
  if (ex.tests.length === 0) errors.push(`${ex.id}: has no tests`);
  if (ex.hints.length !== 2) errors.push(`${ex.id}: needs exactly 2 hints + solution`);
  const sol = await gradeExerciseNode(ex, ex.solution);
  if (!sol.passed) errors.push(`${ex.id} "${ex.title}": SOLUTION FAILS\n${describe(sol)}`);
  const start = await gradeExerciseNode(ex, ex.starter);
  if (start.passed) errors.push(`${ex.id} "${ex.title}": starter code already passes — learner has nothing to do`);
  checked++;
}

const taught = new Set<string>();
let prevWorldMinutes = 0;
for (const world of WORLDS) {
  const wm = worldMinutes(world);
  console.log(`\n=== World ${world.number}: ${world.title} — ${wm} min (min ${world.minMinutes}) ===`);
  if (wm < world.minMinutes) errors.push(`World ${world.number} is ${wm} min, below its ${world.minMinutes} min minimum`);
  if (wm <= prevWorldMinutes) errors.push(`World ${world.number} (${wm} min) must be longer than the previous world (${prevWorldMinutes} min)`);
  prevWorldMinutes = wm;
  for (const level of world.levels) {
    dup(level.id);
    for (const c of [...level.teaches, ...level.requires]) if (!CONCEPTS[c]) errors.push(`${level.id}: unknown concept "${c}"`);
    for (const c of level.requires) if (!taught.has(c)) errors.push(`${level.id}: requires "${c}" before it is taught`);
    level.teaches.forEach((c) => taught.add(c));
    if (only && !level.id.startsWith(only)) continue;
    process.stdout.write(`  ${level.id} ${level.title} (${levelMinutes(level)} min) `);
    for (const card of level.learn) {
      dup(card.id);
      const words = wordCount(card.body);
      if (words > 150) warnings.push(`${card.id}: Learn text is ${words} words (target < 150)`);
      if (card.example.lang === 'python') {
        const r = await runPythonNode(card.example.code, card.example.sampleInput ?? []);
        if (r.error && !card.example.crashes) errors.push(`${card.id}: example crashes: ${r.error.type}: ${r.error.message}`);
      }
    }
    if (level.kind !== 'boss' && level.quiz.length < 3) errors.push(`${level.id}: quiz needs at least 3 questions`);
    if (level.kind === 'level') {
      if (level.practice.length < 2 || level.practice.length > 4) errors.push(`${level.id}: needs 2–4 practice exercises (has ${level.practice.length})`);
      if (!level.quiz.some((q) => q.kind === 'predict')) errors.push(`${level.id}: quiz needs a "predict the output" question`);
      if (!level.quiz.some((q) => q.kind === 'bug')) errors.push(`${level.id}: quiz needs a "spot the bug" question`);
    }
    for (const q of level.quiz) {
      dup(q.id);
      if (q.format === 'mcq' && (q.answer < 0 || q.answer >= q.options.length)) errors.push(`${q.id}: answer index out of range`);
      if (!CONCEPTS[q.concept]) errors.push(`${q.id}: unknown concept ${q.concept}`);
    }
    for (const ex of [...level.practice, ...level.challenges]) await checkExercise(ex);
    console.log('✓');
  }
}

console.log(`\nChecked ${checked} exercises.`);
if (warnings.length) console.log(`\nWarnings:\n- ${warnings.join('\n- ')}`);
if (errors.length) {
  console.error(`\n❌ ${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('✅ All content valid: every solution passes its tests and every starter fails.');
process.exit(0);
