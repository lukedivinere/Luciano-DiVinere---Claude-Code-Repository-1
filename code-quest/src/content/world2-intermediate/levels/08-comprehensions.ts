import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w2.l8',
  title: 'List Comprehensions',
  icon: '⚡',
  summary: 'Build lists in one readable line',
  lang: 'python',
  teaches: ['comprehensions'],
  requires: ['lists', 'for-loop', 'if-else', 'string-manipulation', 'functions', 'return', 'dicts'],
  learn: [
    {
      title: 'Loops in one line',
      minutes: 3,
      analogy: 'A comprehension is a **factory conveyor belt**: items come in, optionally get **filtered**, get **transformed**, and land in a new box.',
      body: `You've written this pattern a lot:

\`\`\`python
squares = []
for n in range(5):
    squares.append(n * n)
\`\`\`

A **list comprehension** says the same in one line:

\`\`\`python
squares = [n * n for n in range(5)]
\`\`\`

Read it as: "**n × n**, for each n in range(5)". Add an \`if\` at the end to **filter**:

\`\`\`python
evens = [n for n in nums if n % 2 == 0]
\`\`\`

Shape: \`[ result  for item in collection  if condition ]\`.

Keep comprehensions simple. If it doesn't fit comfortably on one line, a normal loop is clearer.`,
      example: { lang: 'python', code: code`
        nums = [3, 8, 1, 6, 5]
        print([n * n for n in nums])
        print([n for n in nums if n > 4])
        names = ["ada", "alan", "grace"]
        print([name.upper() for name in names])
        print({name: len(name) for name in names})   # dict comprehension!
      ` },
    },
  ],
  practice: [
    {
      title: 'Squares',
      minutes: 1,
      prompt: 'Write `squares(n)` that returns `[1, 4, 9, …, n²]` using a list comprehension.',
      starter: 'def squares(n):\n    pass\n',
      solution: 'def squares(n):\n    return [i * i for i in range(1, n + 1)]\n',
      solutionExplain: 'The comprehension transforms each i from 1 to n into i × i.',
      hints: ['`range(1, n + 1)` gives 1..n.', '`return [i * i for i in range(1, n + 1)]`'],
      tests: [
        call('squares', [4], [1, 4, 9, 16], '1, 4, 9, 16.'),
        call('squares', [0], [], 'squares(0) is an empty list.'),
        check('Uses a comprehension', "assert '[' in CODE and ' for ' in CODE and '.append' not in CODE", 'Use a list comprehension instead of append.'),
      ],
    },
    {
      title: 'Only the evens',
      minutes: 1,
      prompt: 'Write `evens(nums)` that returns only the even numbers, using a comprehension with an `if`.',
      starter: 'def evens(nums):\n    pass\n',
      solution: 'def evens(nums):\n    return [n for n in nums if n % 2 == 0]\n',
      solutionExplain: 'The `if` at the end filters; `n` itself is the result, unchanged.',
      hints: ['Put the condition at the end of the comprehension.', '`[n for n in nums if n % 2 == 0]`'],
      tests: [
        call('evens', [[1, 2, 3, 4, 5, 6]], [2, 4, 6], 'Keep 2, 4, 6.'),
        call('evens', [[1, 3]], [], 'No evens → empty list.'),
      ],
    },
    {
      title: 'Shout the names',
      minutes: 1,
      prompt: 'Write `shout_all(names)` that returns each name in UPPERCASE with `!` added, skipping empty strings: `["ann", "", "bo"]` → `["ANN!", "BO!"]`.',
      starter: 'def shout_all(names):\n    pass\n',
      solution: 'def shout_all(names):\n    return [name.upper() + "!" for name in names if name != ""]\n',
      solutionExplain: 'Transform (upper + "!") and filter (not empty) in one comprehension.',
      hints: ['You need both a transform and a filter.', '`[name.upper() + "!" for name in names if name != ""]`'],
      tests: [
        call('shout_all', [['ann', '', 'bo']], ['ANN!', 'BO!'], 'Uppercase, add !, skip empties.'),
        call('shout_all', [[]], [], 'Empty in, empty out.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Clean the messy data',
      minutes: 5,
      prompt: `A sensor sends readings as messy text. Write each function as a **single comprehension** (one \`return\` line):

1. \`clean_numbers(items)\` → whole numbers from the valid items. An item is valid if, after \`.strip()\`, it's all digits (\`.isdigit()\`). Convert valid ones with \`int\`.
   \`[" 12", "abc", "7 ", "", "4x"]\` → \`[12, 7]\`
2. \`above(readings, limit)\` → readings strictly greater than \`limit\`.
3. \`label_map(readings)\` → a **dict** from each reading to \`"high"\` (≥ 50) or \`"low"\`. Use a dict comprehension and Python's one-line if: \`"high" if r >= 50 else "low"\`.`,
      starter: 'def clean_numbers(items):\n    pass\n\n\ndef above(readings, limit):\n    pass\n\n\ndef label_map(readings):\n    pass\n',
      solution: 'def clean_numbers(items):\n    return [int(s.strip()) for s in items if s.strip().isdigit()]\n\n\ndef above(readings, limit):\n    return [r for r in readings if r > limit]\n\n\ndef label_map(readings):\n    return {r: "high" if r >= 50 else "low" for r in readings}\n',
      solutionExplain: '`clean_numbers` filters with `s.strip().isdigit()` and transforms with `int(s.strip())`. `above` is a pure filter. `label_map` is a dict comprehension `{key: value for ...}` whose value uses a conditional expression.',
      hints: [
        'Pattern: `[transform for x in items if condition]`. For the dict: `{key: value for x in items}`.',
        '`[int(s.strip()) for s in items if s.strip().isdigit()]` and `{r: "high" if r >= 50 else "low" for r in readings}`.',
      ],
      tests: [
        call('clean_numbers', [[' 12', 'abc', '7 ', '', '4x']], [12, 7], 'Keep only items that are all digits after stripping.'),
        call('clean_numbers', [['0', ' 100 ']], [0, 100], '0 is valid too.'),
        call('above', [[10, 55, 50, 80], 50], [55, 80], 'Strictly greater than the limit.'),
        call('label_map', [[30, 50, 75]], { '30': 'low', '50': 'high', '75': 'high' }, '50 and up is "high".'),
        check('One-line comprehensions', "for block in CODE.split('def ')[1:]:\n    body = [l for l in block.splitlines()[1:] if l.strip() and not l.strip().startswith('#')]\n    assert len(body) == 1, block.split('(')[0] + ' should be a single return line'", 'Each function body should be a single `return` with a comprehension.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'print([x * 10 for x in range(4) if x != 2])',
      answers: ['[0, 10, 30]'],
      explain: 'x goes 0, 1, 3 (2 is filtered out), each times 10.',
    },
    {
      kind: 'concept',
      prompt: 'Which comprehension gives the lengths of `words`?',
      options: ['`[words for len(w) in w]`', '`[len(w) for w in words]`', '`[w for len(w) in words]`', '`len([w for w in words])`'],
      answer: 1,
      explain: 'The result expression comes first: `len(w)`, then `for w in words`.',
    },
    {
      kind: 'bug',
      prompt: 'This should keep words longer than 3 letters but gives a SyntaxError. Fix?',
      code: 'long = [w if len(w) > 3 for w in words]',
      options: ['Move the `if` to the end: `[w for w in words if len(w) > 3]`', 'Add an else', 'Use round brackets', 'Remove `for`'],
      answer: 0,
      explain: 'A filtering `if` goes at the end. (An `if` before `for` needs an `else` — that\'s a different thing: choosing a value.)',
    },
  ],
});
