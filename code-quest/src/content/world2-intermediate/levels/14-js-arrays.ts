import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w2.l14',
  title: 'JS Arrays',
  icon: '🚃',
  summary: 'push, length, map, filter, reduce — JS\'s comprehensions',
  lang: 'javascript',
  teaches: ['js-arrays'],
  requires: ['js-functions', 'lists', 'comprehensions'],
  learn: [
    {
      title: 'Arrays: JS lists',
      minutes: 2,
      analogy: 'Same train of cars as a Python list — JS just calls it an **array**.',
      body: `An **array** is JS's list:

\`\`\`js
const nums = [3, 8, 1];
nums[0];          // 3
nums.length;      // 3   (a property, no brackets — Python: len(nums))
nums.push(5);     // add to the end (Python: append)
nums.includes(8); // true (Python: 8 in nums)
nums.at(-1);      // 5 — last item (nums[-1] does NOT work in JS!)
\`\`\`

\`const\` stops you **reassigning** the variable, but you can still change what's inside the array with \`push\`.

Arrays have a \`.join(", ")\` method too, like Python's \`", ".join(list)\` — just written the other way round.`,
      example: {
        lang: 'javascript',
        code: code`
          const nums = [3, 8, 1];
          nums.push(5);
          console.log(nums, nums.length);
          console.log(nums[0], nums.at(-1), nums[-1]);
          console.log(nums.includes(8), nums.join(" + "));
        `,
      },
    },
    {
      title: 'map, filter, reduce',
      minutes: 3,
      analogy: 'The same **conveyor belt** as comprehensions, split into stations: `filter` removes items, `map` transforms them, `reduce` squashes them into one value.',
      body: `Array methods take a function (usually an arrow) and apply it to each item:

\`\`\`js
nums.map(n => n * 2)          // transform every item
nums.filter(n => n > 2)       // keep items where the test is true
nums.reduce((total, n) => total + n, 0)   // combine into one value
\`\`\`

\`reduce\` runs a running **accumulator**: \`total\` starts at \`0\` (the last argument), then becomes \`total + n\` for each item — the accumulator pattern in one line.

They return **new arrays** and can be chained: \`nums.filter(n => n > 2).map(n => n * 10)\`.`,
      example: {
        lang: 'javascript',
        code: code`
          const nums = [3, 8, 1, 6];
          console.log(nums.map(n => n * 2));
          console.log(nums.filter(n => n > 2));
          console.log(nums.reduce((total, n) => total + n, 0));
          console.log(nums.filter(n => n > 2).map(n => n * 10));
        `,
      },
      compare: {
        left: { lang: 'python', code: 'doubled = [n * 2 for n in nums]\nbig = [n for n in nums if n > 2]\ntotal = sum(nums)' },
        right: { lang: 'javascript', code: 'const doubled = nums.map(n => n * 2);\nconst big = nums.filter(n => n > 2);\nconst total = nums.reduce((t, n) => t + n, 0);' },
        same: ['Transform every item, or keep only some', 'The original list is left unchanged', 'Result is a new list/array'],
        different: ['JS uses methods + arrow functions instead of comprehension syntax', '`reduce` is a general "combine" tool; Python has `sum()`', 'Negative indexes need `.at(-1)` in JS'],
      },
    },
  ],
  practice: [
    {
      title: 'Doubled',
      minutes: 1,
      prompt: 'Write `doubled(nums)` that returns a new array with every number doubled, using `map`.',
      starter: 'function doubled(nums) {\n}\n',
      solution: 'function doubled(nums) {\n  return nums.map(n => n * 2);\n}\n',
      solutionExplain: '`map` applies the arrow function to each item and collects the results.',
      hints: ['`nums.map(...)` with an arrow function.', '`return nums.map(n => n * 2);`'],
      tests: [call('doubled', [[1, 2, 3]], [2, 4, 6], 'Each item × 2'), call('doubled', [[]], [], 'Empty stays empty'), check('Uses map', "assert(CODE.includes('.map('), 'Use .map');", 'Use `.map`.')],
    },
    {
      title: 'Evens only',
      minutes: 1,
      prompt: 'Write `evens(nums)` that returns only the even numbers, using `filter`.',
      starter: 'function evens(nums) {\n}\n',
      solution: 'function evens(nums) {\n  return nums.filter(n => n % 2 === 0);\n}\n',
      solutionExplain: '`filter` keeps items where the arrow returns true.',
      hints: ['`nums.filter(...)`', '`return nums.filter(n => n % 2 === 0);`'],
      tests: [call('evens', [[1, 2, 3, 4]], [2, 4], 'Keep 2 and 4'), check('Uses filter', "assert(CODE.includes('.filter('), 'Use .filter');", 'Use `.filter`.')],
    },
  ],
  challenges: [
    {
      title: 'Score stats with map/filter/reduce',
      minutes: 5,
      prompt: `Write \`scoreStats(scores)\` that returns an array \`[min, max, average]\`, with the average rounded to 1 decimal place. Use \`reduce\` (no loops!).

\`scoreStats([70, 85, 91])\` → \`[70, 91, 82]\`

Rounding to 1 decimal in JS: \`Math.round(x * 10) / 10\`.

Also write \`passing(scores)\` that returns the scores of 60 or more, each converted to a string with a \`%\` sign: \`[50, 60, 99]\` → \`["60%", "99%"]\` (chain \`filter\` then \`map\`).`,
      starter: 'function scoreStats(scores) {\n}\n\nfunction passing(scores) {\n}\n',
      solution: 'function scoreStats(scores) {\n  const min = scores.reduce((a, b) => (b < a ? b : a), scores[0]);\n  const max = scores.reduce((a, b) => (b > a ? b : a), scores[0]);\n  const total = scores.reduce((a, b) => a + b, 0);\n  const average = Math.round((total / scores.length) * 10) / 10;\n  return [min, max, average];\n}\n\nfunction passing(scores) {\n  return scores.filter(s => s >= 60).map(s => `${s}%`);\n}\n',
      solutionExplain: 'Each `reduce` keeps a running answer: the smaller of the two, the larger of the two, or the sum. `(b < a ? b : a)` is JS\'s one-line if ("if b < a then b else a"). `passing` chains filter then map.',
      hints: [
        'Sum: `scores.reduce((a, b) => a + b, 0)`. For min, the accumulator keeps whichever is smaller: `(b < a ? b : a)` — `cond ? x : y` is JS\'s one-line if.',
        'Start min and max reductions at `scores[0]`. `passing`: `scores.filter(s => s >= 60).map(s => `${s}%`)`.',
      ],
      tests: [
        call('scoreStats', [[70, 85, 91]], [70, 91, 82], 'min 70, max 91, average 82'),
        call('scoreStats', [[3, 9, 1, 4, 4]], [1, 9, 4.2], 'Average of 3, 9, 1, 4, 4 is 4.2'),
        call('scoreStats', [[-5]], [-5, -5, -5], 'One score is min, max and average'),
        call('passing', [[50, 60, 99]], ['60%', '99%'], '60 and up, as "N%" strings'),
        check('No loops', "assert(!/\\bfor\\s*\\(|\\bwhile\\s*\\(/.test(CODE), 'Use reduce/map/filter, not loops');", 'Solve it with array methods only.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this log?',
      code: 'const a = [1, 2, 3, 4];\nconsole.log(a.filter(n => n > 1).map(n => n * n).length);',
      codeLang: 'javascript',
      answers: ['3'],
      explain: 'filter keeps [2, 3, 4], map gives [4, 9, 16] — 3 items.',
    },
    {
      kind: 'bug',
      prompt: 'This logs `undefined` instead of the last item. Fix?',
      code: 'const colors = ["red", "green", "blue"];\nconsole.log(colors[-1]);',
      codeLang: 'javascript',
      options: ['Use `colors.at(-1)` or `colors[colors.length - 1]`', 'Use `colors(-1)`', 'Use `colors.last`', 'Use `colors[3]`'],
      answer: 0,
      explain: 'JS arrays don\'t support negative indexes with `[ ]`. `.at(-1)` does.',
    },
    {
      kind: 'concept',
      prompt: 'Which Python feature is closest to JS `nums.map(n => n + 1)`?',
      options: ['`nums.append(1)`', '`[n + 1 for n in nums]`', '`sum(nums) + 1`', '`nums[1]`'],
      answer: 1,
      explain: 'Both build a new list by transforming every item.',
    },
  ],
});
