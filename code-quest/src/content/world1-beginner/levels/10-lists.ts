import { check, code, defineLevel, out } from '../../dsl';

const statsTest = (scores: number[], why: string) => {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  const avgStr = Number.isInteger(avg) ? `${avg}.0` : String(avg);
  return out(
    `Scores ${scores.join(', ')}`,
    `Min: ${min}\nMax: ${max}\nAverage: ${avgStr}`,
    why,
    [String(scores.length), ...scores.map(String)],
  );
};

export default defineLevel({
  id: 'w1.l10',
  title: 'Lists',
  icon: '📋',
  summary: 'Store many values in order; index, append, loop',
  lang: 'python',
  teaches: ['lists'],
  requires: ['for-loop', 'indexing', 'if-else', 'input', 'conversion', 'variables', 'math'],
  learn: [
    {
      title: 'Lists: many values, one name',
      minutes: 2,
      analogy: 'A list is a **train**: each car holds one value, the cars stay in order, and you can add more cars to the end.',
      body: `A **list** holds several values in order, inside square brackets, separated by commas:

\`\`\`python
fruits = ["apple", "banana", "cherry"]
\`\`\`

Each value is an **item** (or **element**). Lists use the same indexing as strings:

- \`fruits[0]\` → \`"apple"\`, \`fruits[-1]\` → \`"cherry"\`
- \`len(fruits)\` → \`3\`

Unlike strings, lists can be changed:

- \`fruits[1] = "blueberry"\` replaces an item.
- \`fruits.append("date")\` adds an item to the end.
- \`[]\` is an **empty list** — handy as a starting point.`,
      example: { lang: 'python', code: code`
        fruits = ["apple", "banana", "cherry"]
        print(fruits[0], fruits[-1], len(fruits))
        fruits[1] = "blueberry"
        fruits.append("date")
        print(fruits)
      ` },
    },
    {
      title: 'Looping over lists, and in',
      minutes: 2,
      analogy: 'Walking down the train and **checking every car** one at a time — that\'s a `for` loop over a list.',
      body: `A \`for\` loop can go straight through a list's items:

\`\`\`python
for fruit in fruits:
    print(fruit)
\`\`\`

\`in\` checks whether a value is in a list, giving True or False:

\`\`\`python
if "apple" in fruits:
    print("We have apples")
\`\`\`

Combined with the accumulator pattern you can compute anything about a list: totals, counts, the largest item… Python also has shortcuts \`sum()\`, \`max()\` and \`min()\`, but writing them yourself first is great practice.`,
      example: { lang: 'python', code: code`
        scores = [7, 3, 9, 4]
        total = 0
        for s in scores:
            total += s
        print("Total:", total)
        print(9 in scores, 5 in scores)
      ` },
    },
  ],
  practice: [
    {
      title: 'Shopping list',
      minutes: 2,
      prompt: `Start with \`items = ["bread", "eggs"]\`. Add \`"milk"\` to the end with \`append\`, then print the list and then its length:

\`\`\`
['bread', 'eggs', 'milk']
3
\`\`\``,
      starter: 'items = ["bread", "eggs"]\n',
      solution: 'items = ["bread", "eggs"]\nitems.append("milk")\nprint(items)\nprint(len(items))\n',
      solutionExplain: '`append` adds to the end of the list itself. Printing a list shows it with brackets and quotes.',
      hints: ['Lists have an `.append(...)` method.', '`items.append("milk")`, then `print(items)` and `print(len(items))`.'],
      tests: [
        out('Prints the list and 3', "['bread', 'eggs', 'milk']\n3", 'Append "milk", then print the list and its length.'),
        check('Uses append', "assert '.append(' in CODE, 'Use items.append(...)'", 'Practice using `.append()` rather than rewriting the list.'),
      ],
    },
    {
      title: 'Find the biggest (by hand)',
      minutes: 3,
      prompt: `Print the largest number in \`nums\` **without** using \`max()\`.

Idea: keep a variable \`biggest\` that starts as the first item. Loop through the list; whenever you see something bigger, update \`biggest\`.`,
      starter: 'nums = [4, 17, 9, 23, 8]\n',
      solution: 'nums = [4, 17, 9, 23, 8]\nbiggest = nums[0]\nfor n in nums:\n    if n > biggest:\n        biggest = n\nprint(biggest)\n',
      solutionExplain: 'Starting with the first item (not 0) means it also works for lists of negative numbers. Each bigger number replaces the current champion.',
      hints: ['`biggest = nums[0]`, then loop over `nums` and compare each `n` with `biggest`.', 'Inside the loop: `if n > biggest:` then `biggest = n`. Print after the loop.'],
      tests: [
        out('Finds 23', '23', 'The largest number in [4, 17, 9, 23, 8] is 23.'),
        check('Works with negatives', "assert RUN(CODE.replace('[4, 17, 9, 23, 8]', '[-5, -2, -9]')).strip() == '-2', 'Start biggest at nums[0], not 0'", 'For [-5, -2, -9] the answer is -2. Did you start at 0 instead of nums[0]?'),
        check('No max()', "assert 'max(' not in CODE, 'Do it without max()'", 'Write the loop yourself — no `max()`.'),
      ],
    },
    {
      title: 'Guest list',
      minutes: 1,
      prompt: 'Read a name. If it is in `guests`, print `Welcome, NAME!`, otherwise `Sorry, NAME is not on the list.`',
      starter: 'guests = ["Ada", "Alan", "Grace"]\nname = input("Name? ")\n',
      solution: 'guests = ["Ada", "Alan", "Grace"]\nname = input("Name? ")\nif name in guests:\n    print(f"Welcome, {name}!")\nelse:\n    print(f"Sorry, {name} is not on the list.")\n',
      solutionExplain: '`name in guests` is True when the name matches one of the items.',
      hints: ['Use `in` to test membership.', '`if name in guests:`'],
      sampleInput: ['Grace'],
      tests: [
        out('Grace is invited', 'Welcome, Grace!', 'Grace is on the list.', ['Grace']),
        out('Bob is not', 'Sorry, Bob is not on the list.', 'Bob is not on the list.', ['Bob']),
      ],
    },
  ],
  challenges: [
    {
      title: 'Score statistics',
      minutes: 5,
      prompt: `First read how many scores there are, then read each score (whole numbers). Store them in a list and print the minimum, maximum and average (rounded to 1 decimal place).

**Without** using \`min()\`, \`max()\` or \`sum()\` — loops only!

Typing \`3\`, then \`70\`, \`85\`, \`91\`:

\`\`\`
Min: 70
Max: 91
Average: 82.0
\`\`\``,
      starter: 'count = int(input("How many scores? "))\nscores = []\n\n# Read the scores into the list\n\n\n# Work out min, max and average\n',
      solution: 'count = int(input("How many scores? "))\nscores = []\n\nfor i in range(count):\n    scores.append(int(input("Score: ")))\n\nlowest = scores[0]\nhighest = scores[0]\ntotal = 0\nfor s in scores:\n    if s < lowest:\n        lowest = s\n    if s > highest:\n        highest = s\n    total += s\n\nprint(f"Min: {lowest}")\nprint(f"Max: {highest}")\nprint(f"Average: {round(total / count, 1)}")\n',
      solutionExplain: 'A first loop reads `count` scores into the list with `append`. A second loop tracks the lowest, highest and running total at the same time. The average is total ÷ count, rounded to 1 place.',
      hints: [
        'Use `for i in range(count):` to read each score and `append` it. Then a second loop over `scores` that tracks lowest, highest and total.',
        'Start `lowest` and `highest` at `scores[0]` and `total` at 0. Average: `round(total / count, 1)`.',
      ],
      sampleInput: ['3', '70', '85', '91'],
      tests: [
        statsTest([70, 85, 91], 'Read 3 scores, then print Min, Max and Average.'),
        statsTest([50], 'With one score, min, max and average are all that score.'),
        statsTest([3, 9, 1, 4, 4], 'Average of 3, 9, 1, 4, 4 is 4.2. Make sure you read exactly `count` scores.'),
        check('No min/max/sum', "assert 'min(' not in CODE and 'max(' not in CODE and 'sum(' not in CODE, 'Use loops instead of min/max/sum'", 'Do it with loops — `min()`, `max()` and `sum()` are off-limits here.', undefined, ['1', '5']),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'nums = [10, 20, 30]\nnums.append(40)\nprint(nums[1], len(nums))',
      answers: ['20 4'],
      explain: 'Index 1 is the second item (20). After append there are 4 items.',
    },
    {
      kind: 'bug',
      prompt: 'Which line causes an IndexError?',
      code: '1  colors = ["red", "green", "blue"]\n2  print(colors[0])\n3  print(colors[2])\n4  print(colors[3])',
      options: ['Line 2', 'Line 3', 'Line 4', 'None'],
      answer: 2,
      explain: 'A 3-item list has indexes 0, 1 and 2. Index 3 doesn\'t exist.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'pets = ["cat", "dog"]\nprint("dog" in pets)\nprint("Cat" in pets)',
      answers: ['True\nFalse'],
      explain: '"dog" is in the list. "Cat" with a capital C is a different string from "cat".',
    },
  ],
});
