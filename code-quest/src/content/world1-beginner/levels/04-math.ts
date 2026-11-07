import { check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w1.l4',
  title: 'Math',
  icon: '➗',
  summary: 'Operators, order of operations, // and %, round()',
  lang: 'python',
  teaches: ['math'],
  requires: ['print', 'variables', 'types', 'fstrings'],
  learn: [
    {
      title: 'Python is a calculator',
      minutes: 2,
      analogy: 'Python is a **calculator that remembers**: it does the math, and variables let you keep results for later.',
      body: `The **arithmetic operators**:

| Operator | Meaning | Example | Result |
|---|---|---|---|
| \`+\` | add | \`7 + 2\` | \`9\` |
| \`-\` | subtract | \`7 - 2\` | \`5\` |
| \`*\` | multiply | \`7 * 2\` | \`14\` |
| \`/\` | divide | \`7 / 2\` | \`3.5\` |
| \`**\` | power | \`2 ** 3\` | \`8\` |

\`/\` always gives a float, even \`8 / 2\` → \`4.0\`.

**Order of operations** works like in school: \`**\` first, then \`*\` and \`/\`, then \`+\` and \`-\`. Use brackets to choose the order: \`(2 + 3) * 4\` is 20, but \`2 + 3 * 4\` is 14.`,
      example: { lang: 'python', code: code`
        price = 4
        qty = 3
        total = price * qty
        print("Total:", total)
        print(2 + 3 * 4)
        print((2 + 3) * 4)
        print(10 / 4)
        print(2 ** 10)
      ` },
    },
    {
      title: 'Whole division, remainders, rounding',
      minutes: 2,
      analogy: 'Sharing 17 slices of pizza among 5 friends: each gets **3** (that\'s `//`) and **2** are left over (that\'s `%`).',
      body: `- \`//\` is **floor division**: divide and drop the decimal part. \`17 // 5\` → \`3\`.
- \`%\` is **modulo**: the remainder after dividing. \`17 % 5\` → \`2\`.

\`%\` is very handy: \`n % 2\` is \`0\` for even numbers and \`1\` for odd ones.

Converting units uses both: 135 minutes is \`135 // 60\` = 2 hours and \`135 % 60\` = 15 minutes.

\`round(x, 2)\` rounds a float to 2 decimal places: \`round(3.14159, 2)\` → \`3.14\`. Floats can be slightly imprecise (\`0.1 + 0.2\` is \`0.30000000000000004\`!), so round money before printing.`,
      example: { lang: 'python', code: code`
        print(17 // 5, 17 % 5)
        minutes = 135
        print(minutes // 60, "hours", minutes % 60, "minutes")
        print(0.1 + 0.2)
        print(round(0.1 + 0.2, 2))
      ` },
    },
  ],
  practice: [
    {
      title: 'Rectangle area',
      minutes: 1,
      prompt: 'Calculate the area of a rectangle (width × height) and print it. With the starter values it should print `21`.',
      starter: 'width = 7\nheight = 3\n',
      solution: 'width = 7\nheight = 3\narea = width * height\nprint(area)\n',
      solutionExplain: 'Multiply with `*`, store it in `area`, then print it.',
      hints: ['Multiplication uses `*`.', '`area = width * height` then `print(area)`.'],
      tests: [
        out('Prints 21', '21', 'Multiply width by height.'),
        check('Uses the variables', "assert RUN(CODE.replace('width = 7', 'width = 10')).strip() == '30'", 'With width = 10 the area should be 30. Use the variables in your calculation.'),
      ],
    },
    {
      title: 'Minutes to hours',
      minutes: 2,
      prompt: `Convert \`total_minutes\` to hours and minutes using \`//\` and \`%\`. For 135 print:

\`\`\`
2 hours 15 minutes
\`\`\``,
      starter: 'total_minutes = 135\n',
      solution: 'total_minutes = 135\nhours = total_minutes // 60\nminutes = total_minutes % 60\nprint(hours, "hours", minutes, "minutes")\n',
      solutionExplain: '`// 60` counts the full hours; `% 60` gives the leftover minutes.',
      hints: ['There are 60 minutes in an hour. Whole hours use `//`, leftover minutes use `%`.', '`hours = total_minutes // 60` and `minutes = total_minutes % 60`.'],
      tests: [
        out('135 minutes', '2 hours 15 minutes', 'Expected "2 hours 15 minutes".'),
        check('Works for 61 minutes', "assert RUN(CODE.replace('135', '61')).strip() == '1 hours 1 minutes'", 'With 61 minutes it should print "1 hours 1 minutes". Use // and % on the variable.'),
      ],
    },
    {
      title: 'Odd or even?',
      minutes: 1,
      prompt: 'Print the remainder of `n` divided by 2. For `n = 17` that\'s `1` (odd). Then print `2` to the power of `n`.',
      starter: 'n = 17\n',
      solution: 'n = 17\nprint(n % 2)\nprint(2 ** n)\n',
      solutionExplain: '`n % 2` is 1 for odd numbers and 0 for even ones. `**` is the power operator.',
      hints: ['Remainder is `%`, power is `**`.', '`print(n % 2)` then `print(2 ** n)`.'],
      tests: [
        out('n = 17', '1\n131072', 'Line 1: 17 % 2. Line 2: 2 ** 17.'),
        check('n = 10', "assert RUN(CODE.replace('n = 17', 'n = 10')).split() == ['0', '1024']", 'With n = 10 you should print 0 and 1024.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Tip calculator',
      minutes: 4,
      prompt: `Split a restaurant bill. Using \`bill\`, \`tip_percent\` and \`people\`, print the tip, the total, and what each person pays, all **rounded to 2 decimal places**:

\`\`\`
Tip: 8.73
Total: 57.23
Each pays: 19.08
\`\`\`

(18% of 48.50 is 8.73.) The hidden tests try other bills too.`,
      starter: 'bill = 48.50\ntip_percent = 18\npeople = 3\n\n# Your code here\n',
      solution: 'bill = 48.50\ntip_percent = 18\npeople = 3\n\ntip = bill * tip_percent / 100\ntotal = bill + tip\neach = total / people\n\nprint("Tip:", round(tip, 2))\nprint("Total:", round(total, 2))\nprint("Each pays:", round(each, 2))\n',
      solutionExplain: 'A percentage is "out of 100", so the tip is `bill * tip_percent / 100`. Add it to get the total, divide by people, and round each result when printing.',
      hints: [
        'The tip is the bill times the percent, divided by 100. Then total = bill + tip, and each = total / people.',
        'Print with `print("Tip:", round(tip, 2))` — do the same for total and each.',
      ],
      tests: [
        out('48.50, 18%, 3 people', 'Tip: 8.73\nTotal: 57.23\nEach pays: 19.08', 'Check the tip formula (divide by 100) and round each number to 2 places.'),
        check(
          '100, 20%, 4 people',
          "got = RUN(CODE.replace('48.50', '100').replace('18', '20').replace('people = 3', 'people = 4')).split('\\n')\nassert got[:3] == ['Tip: 20.0', 'Total: 120.0', 'Each pays: 30.0'], 'Got: ' + str(got)",
          'With bill 100, tip 20% and 4 people: Tip 20.0, Total 120.0, Each pays 30.0.',
        ),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'print(2 + 3 * 2)',
      answers: ['8'],
      explain: 'Multiplication happens first: 3 × 2 = 6, then 2 + 6 = 8.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'print(14 // 4, 14 % 4)',
      answers: ['3 2'],
      explain: '4 fits into 14 three whole times (12), leaving a remainder of 2.',
    },
    {
      kind: 'concept',
      prompt: 'What is `9 / 3` in Python?',
      options: ['3', '3.0', '"3"', 'An error'],
      answer: 1,
      explain: '`/` always gives a float, even when the answer is a whole number.',
    },
    {
      kind: 'bug',
      prompt: 'This should print the average of 4 and 6 (which is 5), but prints 7.0. What\'s the fix?',
      code: 'print(4 + 6 / 2)',
      options: ['Use `//` instead of `/`', 'Put brackets around `4 + 6`', 'Use `*` instead of `/`', 'Use round()'],
      answer: 1,
      explain: 'Division happens before addition. `(4 + 6) / 2` adds first, giving 5.0.',
    },
  ],
});
