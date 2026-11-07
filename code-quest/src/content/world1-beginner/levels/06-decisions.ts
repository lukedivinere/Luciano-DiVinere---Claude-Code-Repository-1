import { code, defineLevel, out } from '../../dsl';

const gradeTests = [
  ['95', 'A'], ['90', 'A'], ['89', 'B'], ['80', 'B'], ['75', 'C'], ['60', 'D'], ['59', 'F'], ['0', 'F'],
].map(([score, g]) => out(`Score ${score} → ${g}`, `Grade: ${g}`, `A score of ${score} should get ${g}. Check your boundaries: is it >= or >?`, [score]));

export default defineLevel({
  id: 'w1.l6',
  title: 'Decisions',
  icon: '🔀',
  summary: 'if / elif / else and comparisons',
  lang: 'python',
  teaches: ['if-else', 'comparison'],
  requires: ['input', 'conversion', 'print', 'variables'],
  learn: [
    {
      title: 'if and else',
      minutes: 2,
      analogy: 'An `if` is a **fork in the road**: the program checks a sign and takes only one path.',
      body: `An **if statement** runs code only when a **condition** is true:

\`\`\`python
if temperature > 30:
    print("It's hot!")
else:
    print("Not too hot.")
\`\`\`

Rules:

- The \`if\` line ends with a colon \`:\`.
- The lines that belong to it are **indented** (4 spaces). This indented group is called a **block**.
- \`else:\` is optional and runs when the condition is false.

Indentation isn't decoration in Python — it decides which lines belong to which path.`,
      example: { lang: 'python', code: code`
        temperature = int(input("Temperature? "))
        if temperature > 30:
            print("It's hot!")
            print("Drink water.")
        else:
            print("Not too hot.")
        print("This line always runs.")
      `, sampleInput: ['34'] },
    },
    {
      title: 'Comparisons and elif',
      minutes: 2,
      analogy: '`elif` is a **line of doors**: Python tries each door in order and walks through the first one that opens.',
      body: `**Comparison operators** produce \`True\` or \`False\`:

| \`==\` equal | \`!=\` not equal | \`<\` less | \`>\` greater | \`<=\` at most | \`>=\` at least |

Note: \`=\` stores a value, \`==\` compares two values.

\`elif\` (short for "else if") checks another condition when the earlier ones were false:

\`\`\`python
if n > 0:
    print("positive")
elif n < 0:
    print("negative")
else:
    print("zero")
\`\`\`

Only the **first** true branch runs, so order matters.`,
      example: { lang: 'python', code: code`
        n = int(input("Number? "))
        print(n == 0, n > 0)
        if n > 0:
            print("positive")
        elif n < 0:
            print("negative")
        else:
            print("zero")
      `, sampleInput: ['-4'] },
    },
  ],
  practice: [
    {
      title: 'Positive, negative or zero',
      minutes: 2,
      prompt: 'Read a whole number with `input()` and print `positive`, `negative` or `zero`.',
      starter: 'n = int(input("Number? "))\n',
      solution: 'n = int(input("Number? "))\nif n > 0:\n    print("positive")\nelif n < 0:\n    print("negative")\nelse:\n    print("zero")\n',
      solutionExplain: 'Three branches cover every case: greater than 0, less than 0, and everything else (exactly 0).',
      hints: ['Use `if`, `elif` and `else`. Remember the colon and the indentation.', '`if n > 0:` … `elif n < 0:` … `else:` …'],
      sampleInput: ['5'],
      tests: [
        out('5 is positive', 'positive', 'Numbers above 0 are positive.', ['5']),
        out('-3 is negative', 'negative', 'Numbers below 0 are negative.', ['-3']),
        out('0 is zero', 'zero', '0 is neither positive nor negative.', ['0']),
      ],
    },
    {
      title: 'Pass or fail',
      minutes: 2,
      prompt: 'Read a score. Print `Pass` if it is **50 or more**, otherwise `Fail`.',
      starter: 'score = int(input("Score? "))\n',
      solution: 'score = int(input("Score? "))\nif score >= 50:\n    print("Pass")\nelse:\n    print("Fail")\n',
      solutionExplain: '"50 or more" means `>= 50` — exactly 50 passes.',
      hints: ['"50 or more" — which comparison includes 50 itself?', '`if score >= 50:` then `print("Pass")`, `else:` `print("Fail")`.'],
      sampleInput: ['72'],
      tests: [
        out('72 passes', 'Pass', '72 is above 50.', ['72']),
        out('50 passes (edge case)', 'Pass', 'Exactly 50 should pass — use >=, not >.', ['50']),
        out('49 fails', 'Fail', '49 is below 50.', ['49']),
      ],
    },
  ],
  challenges: [
    {
      title: 'Letter-grade machine',
      minutes: 4,
      prompt: `Read a score (0–100) and print its letter grade:

| Score | Grade |
|---|---|
| 90 and up | A |
| 80–89 | B |
| 70–79 | C |
| 60–69 | D |
| below 60 | F |

Print it like \`Grade: B\`.`,
      starter: 'score = int(input("Score? "))\n',
      solution: 'score = int(input("Score? "))\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelif score >= 60:\n    grade = "D"\nelse:\n    grade = "F"\nprint(f"Grade: {grade}")\n',
      solutionExplain: 'Check from the highest grade down. Because only the first true branch runs, `elif score >= 80` only runs for scores below 90 — so it means 80–89.',
      hints: [
        'Start with the highest grade: `if score >= 90:`. Then `elif score >= 80:` and so on. Order matters!',
        'Store the letter in a variable `grade` in each branch, then print once at the end: `print(f"Grade: {grade}")`.',
      ],
      sampleInput: ['85'],
      tests: gradeTests,
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'x = 7\nif x > 10:\n    print("big")\nelif x > 5:\n    print("medium")\nelif x > 0:\n    print("small")',
      answers: ['medium'],
      explain: 'x > 10 is false; x > 5 is true, so "medium" prints and the rest are skipped — even though x > 0 is also true.',
    },
    {
      kind: 'bug',
      prompt: 'Why does this crash with a SyntaxError?',
      code: 'age = 20\nif age = 18:\n    print("Just an adult!")',
      options: ['Missing colon', 'It uses `=` instead of `==`', 'print should not be indented', 'age should be a string'],
      answer: 1,
      explain: '`=` stores a value; comparing needs `==`: `if age == 18:`.',
      concept: 'comparison',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'print(3 != 4)\nprint(5 <= 5)',
      answers: ['True\nTrue'],
      explain: '3 is not equal to 4 → True. 5 is "at most" 5 → True.',
      concept: 'comparison',
    },
    {
      kind: 'concept',
      prompt: 'What decides which lines are inside an `if` block?',
      options: ['Curly braces', 'Indentation', 'Semicolons', 'Blank lines'],
      answer: 1,
      explain: 'Python uses indentation (usually 4 spaces) to group lines into blocks.',
    },
  ],
});
