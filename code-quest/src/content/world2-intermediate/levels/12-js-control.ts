import { call, code, defineLevel } from '../../dsl';

function fizz(n: number) {
  const r: string[] = [];
  for (let i = 1; i <= n; i++) r.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i));
  return r;
}

export default defineLevel({
  id: 'w2.l12',
  title: 'JS Decisions & Loops',
  icon: '🔀',
  summary: 'if / else if, &&, ||, for, for…of, while',
  lang: 'javascript',
  teaches: ['js-control'],
  requires: ['js-basics', 'if-else', 'logic', 'for-loop', 'while-loop', 'functions'],
  learn: [
    {
      title: 'Decisions in JS',
      minutes: 3,
      analogy: 'Same fork in the road as Python — JS just puts **fences** (curly braces) around each path instead of using indentation.',
      body: `JS uses curly braces \`{ }\` to mark blocks, and the condition goes in round brackets:

\`\`\`js
if (score >= 90) {
  console.log("A");
} else if (score >= 80) {
  console.log("B");
} else {
  console.log("C or lower");
}
\`\`\`

Logical operators use symbols:

| Python | JS |
|---|---|
| \`and\` | \`&&\` |
| \`or\` | \`\\|\\|\` |
| \`not\` | \`!\` |
| \`==\` | \`===\` |
| \`!=\` | \`!==\` |

Indentation is optional in JS, but always indent anyway — it keeps code readable.

A **function** in JS looks like this (more next level): \`function name(param) { return ...; }\``,
      example: {
        lang: 'javascript',
        code: code`
          function grade(score) {
            if (score >= 90) {
              return "A";
            } else if (score >= 80) {
              return "B";
            } else {
              return "C or lower";
            }
          }
          console.log(grade(95), grade(85), grade(40));
          console.log(true && false, true || false, !true);
        `,
      },
      compare: {
        left: { lang: 'python', code: 'if age >= 8 and height >= 120:\n    print("Ride!")\nelse:\n    print("Not yet")' },
        right: { lang: 'javascript', code: 'if (age >= 8 && height >= 120) {\n  console.log("Ride!");\n} else {\n  console.log("Not yet");\n}' },
        same: ['if / else if (elif) / else structure', 'Comparison operators `<`, `>=` etc.', 'Only the first true branch runs'],
        different: ['Condition in `( )`, block in `{ }`', '`&&` `||` `!` instead of `and` `or` `not`', '`else if` instead of `elif`; `===` instead of `==`'],
      },
    },
    {
      title: 'Loops in JS',
      minutes: 3,
      analogy: 'The classic JS `for` loop is like setting a **lap counter** yourself: start value, keep-going rule, and how to count each lap.',
      body: `The classic \`for\` loop has three parts in brackets — start; condition; step:

\`\`\`js
for (let i = 1; i <= 5; i++) {
  console.log(i);
}
\`\`\`

\`i++\` means "add 1 to i". This is like Python's \`for i in range(1, 6)\`.

To loop over the items of an array (JS's list) use \`for...of\` — like Python's \`for x in list\`:

\`\`\`js
for (const fruit of ["apple", "pear"]) {
  console.log(fruit);
}
\`\`\`

\`while (condition) { ... }\` and \`break\` work just like in Python.`,
      example: {
        lang: 'javascript',
        code: code`
          for (let i = 1; i <= 3; i++) {
            console.log("lap", i);
          }
          for (const fruit of ["apple", "pear"]) {
            console.log(fruit);
          }
          let n = 3;
          while (n > 0) {
            console.log(n);
            n--;
          }
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Grade in JS',
      minutes: 3,
      prompt: 'Write `letterGrade(score)` returning `"A"` (90+), `"B"` (80+), `"C"` (70+), `"D"` (60+) or `"F"` — the same rules as World 1, now in JS.',
      starter: 'function letterGrade(score) {\n  // your if / else if chain\n}\n',
      solution: 'function letterGrade(score) {\n  if (score >= 90) {\n    return "A";\n  } else if (score >= 80) {\n    return "B";\n  } else if (score >= 70) {\n    return "C";\n  } else if (score >= 60) {\n    return "D";\n  }\n  return "F";\n}\n',
      solutionExplain: 'The same top-down checks as the Python version; `return` exits the function as soon as a branch matches.',
      hints: ['Check the highest grade first: `if (score >= 90) { return "A"; }`.', 'Continue with `else if (score >= 80) { return "B"; }` … and `return "F";` at the end.'],
      tests: [
        call('letterGrade', [95], 'A', '95 → A'),
        call('letterGrade', [80], 'B', '80 → B (boundary)'),
        call('letterGrade', [72], 'C', '72 → C'),
        call('letterGrade', [60], 'D', '60 → D (boundary)'),
        call('letterGrade', [12], 'F', '12 → F'),
      ],
    },
    {
      title: 'Sum to N',
      minutes: 2,
      prompt: 'Write `sumTo(n)` that returns 1 + 2 + … + n using a classic `for` loop.',
      starter: 'function sumTo(n) {\n  let total = 0;\n  // loop here\n  return total;\n}\n',
      solution: 'function sumTo(n) {\n  let total = 0;\n  for (let i = 1; i <= n; i++) {\n    total += i;\n  }\n  return total;\n}\n',
      solutionExplain: 'Same accumulator pattern as Python: start at 0, add each i, return after the loop.',
      hints: ['`for (let i = 1; i <= n; i++) { ... }`', 'Inside the loop: `total += i;`'],
      tests: [call('sumTo', [4], 10, '1+2+3+4 = 10'), call('sumTo', [100], 5050, '1..100 = 5050'), call('sumTo', [0], 0, 'Nothing to add → 0')],
    },
  ],
  challenges: [
    {
      title: 'FizzBuzz, JS edition',
      minutes: 5,
      prompt: `Write \`fizzBuzz(n)\` that **returns an array** (JS's list) of strings for 1 to n, using the FizzBuzz rules from World 1:
multiples of 3 → \`"Fizz"\`, of 5 → \`"Buzz"\`, of both → \`"FizzBuzz"\`, otherwise the number as a string.

\`fizzBuzz(5)\` → \`["1", "2", "Fizz", "4", "Buzz"]\`

Useful: \`const result = [];\` makes an empty array, \`result.push(x)\` adds to it (like append), and \`String(i)\` turns a number into text (like \`str(i)\`).`,
      starter: 'function fizzBuzz(n) {\n  const result = [];\n  // your loop\n  return result;\n}\n',
      solution: 'function fizzBuzz(n) {\n  const result = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 3 === 0 && i % 5 === 0) {\n      result.push("FizzBuzz");\n    } else if (i % 3 === 0) {\n      result.push("Fizz");\n    } else if (i % 5 === 0) {\n      result.push("Buzz");\n    } else {\n      result.push(String(i));\n    }\n  }\n  return result;\n}\n',
      solutionExplain: 'Identical logic to the Python version: check "both" first, use `%` for multiples. Only the syntax changed: `&&`, `===`, braces, `push`.',
      hints: [
        'Loop `for (let i = 1; i <= n; i++)` and use if / else if / else. Check the "both" case first.',
        '`if (i % 3 === 0 && i % 5 === 0) { result.push("FizzBuzz"); }` … `else { result.push(String(i)); }`',
      ],
      tests: [
        call('fizzBuzz', [5], fizz(5), '1, 2, Fizz, 4, Buzz'),
        call('fizzBuzz', [15], fizz(15), '15 must be "FizzBuzz" — check that case first.'),
        call('fizzBuzz', [0], [], 'fizzBuzz(0) is an empty array.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this log?',
      code: 'let out = "";\nfor (let i = 0; i < 3; i++) {\n  out += i;\n}\nconsole.log(out);',
      codeLang: 'javascript',
      answers: ['012'],
      explain: '`out` is a string, so `+=` glues 0, 1 and 2 on as text.',
    },
    {
      kind: 'bug',
      prompt: 'This should only log for teenagers, but logs for everyone. Why?',
      code: 'const age = 40;\nif (age >= 13 || age <= 19) {\n  console.log("Teen!");\n}',
      codeLang: 'javascript',
      options: ['`||` should be `&&` — both must be true', '`>=` should be `>`', 'Missing else', 'age should be let'],
      answer: 0,
      explain: 'With `||`, 40 >= 13 is enough to be true. A range needs both conditions: `&&`.',
    },
    {
      kind: 'concept',
      prompt: 'Which loop is the JS equivalent of Python\'s `for x in items:`?',
      options: ['`for (x in items)`', '`for (const x of items)`', '`foreach x items`', '`while (x of items)`'],
      answer: 1,
      explain: '`for...of` gives each item. (`for...in` gives the indexes/keys — a common mix-up.)',
    },
  ],
});
