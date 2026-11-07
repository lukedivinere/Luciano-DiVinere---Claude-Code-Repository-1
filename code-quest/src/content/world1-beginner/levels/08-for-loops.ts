import { code, defineLevel, out } from '../../dsl';

function fizz(n: number) {
  const lines: string[] = [];
  for (let i = 1; i <= n; i++) lines.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i));
  return lines.join('\n');
}

export default defineLevel({
  id: 'w1.l8',
  title: 'for Loops',
  icon: '🔁',
  summary: 'Repeat with for and range(); the accumulator pattern',
  lang: 'python',
  teaches: ['for-loop', 'range'],
  requires: ['print', 'variables', 'math', 'input', 'conversion', 'if-else', 'fstrings'],
  learn: [
    {
      title: 'Repeating with for',
      minutes: 2,
      analogy: 'A `for` loop is a **playlist on repeat for a set number of songs**: same steps, a new value each time.',
      body: `A **loop** repeats a block of code. A \`for\` loop runs once for each value in a sequence:

\`\`\`python
for i in range(3):
    print("Hello", i)
\`\`\`

prints \`Hello 0\`, \`Hello 1\`, \`Hello 2\`. Each time around is called an **iteration**, and \`i\` (the **loop variable**) holds the current value.

\`range\` makes number sequences. It **stops before** the end number:

- \`range(5)\` → 0, 1, 2, 3, 4
- \`range(1, 6)\` → 1, 2, 3, 4, 5
- \`range(0, 10, 2)\` → 0, 2, 4, 6, 8 (step of 2)

You can also loop over a string, one character at a time: \`for ch in "hey":\`.`,
      example: { lang: 'python', code: code`
        for i in range(1, 6):
            print("Lap", i)

        for ch in "hey":
            print(ch.upper())
      ` },
    },
    {
      title: 'The accumulator pattern',
      minutes: 2,
      analogy: 'A **piggy bank**: start empty, drop a coin in on every loop, and count what\'s inside at the end.',
      body: `To build up a result, create a variable **before** the loop, then update it **inside** the loop. This is the **accumulator pattern**:

\`\`\`python
total = 0
for n in range(1, 5):
    total = total + n
print(total)   # 10
\`\`\`

\`total += n\` is a shortcut for \`total = total + n\` (also \`-=\`, \`*=\`).

Watch your indentation: the \`print\` is **not** indented, so it runs once after the loop finishes. Indent it and it would print every time around.`,
      example: { lang: 'python', code: code`
        total = 0
        for n in range(1, 5):
            total += n
            print("added", n, "-> total is", total)
        print("Final:", total)
      ` },
    },
  ],
  practice: [
    {
      title: 'Count to 10',
      minutes: 1,
      prompt: 'Print the numbers 1 to 10, one per line, using a `for` loop and `range`.',
      starter: '',
      solution: 'for i in range(1, 11):\n    print(i)\n',
      solutionExplain: '`range(1, 11)` starts at 1 and stops before 11.',
      hints: ['`range` stops BEFORE its end number. What end number gives you 10?', '`for i in range(1, 11):` then indent `print(i)`.'],
      tests: [out('Prints 1–10', '1\n2\n3\n4\n5\n6\n7\n8\n9\n10', 'You need exactly 1 through 10. Is your range one short?')],
    },
    {
      title: 'Sum up to N',
      minutes: 2,
      prompt: 'Read a number `n` and print the sum 1 + 2 + … + n. For `4` that is `10`. Use the accumulator pattern.',
      starter: 'n = int(input("n? "))\n',
      solution: 'n = int(input("n? "))\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)\n',
      solutionExplain: 'Start `total` at 0, add each number from 1 to n (that\'s `range(1, n + 1)`), and print once after the loop.',
      hints: ['Make `total = 0` before the loop and add `i` to it inside. Print after the loop (not indented).', '`for i in range(1, n + 1):` then `total += i`.'],
      sampleInput: ['4'],
      tests: [
        out('n = 4', '10', '1+2+3+4 = 10. Did your range include n itself?', ['4']),
        out('n = 100', '5050', '1+2+…+100 = 5050.', ['100']),
        out('n = 1', '1', 'With n = 1 the sum is just 1.', ['1']),
      ],
    },
    {
      title: 'Times table',
      minutes: 2,
      prompt: `Read a number and print its times table from 1 to 10, like this for \`7\`:

\`\`\`
7 x 1 = 7
7 x 2 = 14
...
7 x 10 = 70
\`\`\``,
      starter: 'n = int(input("Which table? "))\n',
      solution: 'n = int(input("Which table? "))\nfor i in range(1, 11):\n    print(f"{n} x {i} = {n * i}")\n',
      solutionExplain: 'Loop i from 1 to 10 and use an f-string with the math `{n * i}` inside.',
      hints: ['Loop from 1 to 10 and print one line per iteration with an f-string.', '`print(f"{n} x {i} = {n * i}")`'],
      sampleInput: ['7'],
      tests: [
        out('7 times table', Array.from({ length: 10 }, (_, i) => `7 x ${i + 1} = ${7 * (i + 1)}`).join('\n'), 'Ten lines, from "7 x 1 = 7" to "7 x 10 = 70".', ['7']),
        out('3 times table', Array.from({ length: 10 }, (_, i) => `3 x ${i + 1} = ${3 * (i + 1)}`).join('\n'), 'Use the number that was typed.', ['3']),
      ],
    },
  ],
  challenges: [
    {
      title: 'FizzBuzz',
      minutes: 5,
      prompt: `The famous interview warm-up! Read \`n\`, then print each number from 1 to n, **except**:

- multiples of **3** print \`Fizz\`
- multiples of **5** print \`Buzz\`
- multiples of **both** 3 and 5 print \`FizzBuzz\`

For \`n = 15\` the last lines are \`13\`, \`14\`, \`FizzBuzz\`.

Tip: "is a multiple of 3" means \`i % 3 == 0\`.`,
      starter: 'n = int(input("n? "))\n',
      solution: 'n = int(input("n? "))\nfor i in range(1, n + 1):\n    if i % 3 == 0 and i % 5 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)\n',
      solutionExplain: 'Check the "both" case FIRST — otherwise 15 would match `i % 3 == 0` and print just "Fizz". The `else` prints the plain number.',
      hints: [
        'Loop 1..n. Inside, use if/elif/else with `%`. Which case must be checked first?',
        'Put `if i % 3 == 0 and i % 5 == 0:` first, then `elif i % 3 == 0:`, then `elif i % 5 == 0:`, then `else: print(i)`.',
      ],
      sampleInput: ['15'],
      tests: [
        out('n = 15', fizz(15), 'Check the order of your conditions: 15 must print FizzBuzz, not Fizz.', ['15']),
        out('n = 5', fizz(5), 'For n = 5: 1, 2, Fizz, 4, Buzz.', ['5']),
        out('n = 31', fizz(31), 'Your loop should go all the way up to n, including n.', ['31']),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'for i in range(2, 5):\n    print(i)',
      answers: ['2\n3\n4'],
      explain: 'range(2, 5) starts at 2 and stops BEFORE 5.',
      concept: 'range',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'total = 0\nfor i in range(3):\n    total += 2\nprint(total)',
      answers: ['6'],
      explain: 'The loop runs 3 times, adding 2 each time: 0 → 2 → 4 → 6.',
    },
    {
      kind: 'bug',
      prompt: 'This should print the total once, but prints it 4 times. What\'s wrong?',
      code: 'total = 0\nfor n in range(1, 5):\n    total += n\n    print(total)',
      options: ['range should be range(5)', '`print` is indented inside the loop', '`+=` should be `=`', '`total` should start at 1'],
      answer: 1,
      explain: 'Indented lines run every iteration. Un-indent `print(total)` so it runs once after the loop.',
    },
    {
      kind: 'concept',
      prompt: 'How many times does `for i in range(10):` repeat?',
      options: ['9', '10', '11', 'Forever'],
      answer: 1,
      explain: 'range(10) is 0..9 — ten values, so ten iterations.',
      concept: 'range',
    },
  ],
});
