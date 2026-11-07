import { check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w2.l11',
  title: 'Hello, JavaScript',
  icon: '🟨',
  summary: 'console.log, let/const, types — side by side with Python',
  lang: 'javascript',
  teaches: ['js-basics'],
  requires: ['print', 'variables', 'types', 'fstrings'],
  learn: [
    {
      title: 'A second language',
      minutes: 3,
      analogy: 'Learning JavaScript after Python is like learning **Spanish after Italian**: the grammar and spelling differ, but the ideas — variables, loops, functions — are the same.',
      body: `**JavaScript** (JS) is the language of web browsers: every interactive website uses it. Good news: almost every idea you learned in Python carries over.

- \`console.log(...)\` is JS's \`print(...)\`.
- Variables are created with \`let\` (can change later) or \`const\` (can't be reassigned). Prefer \`const\` unless you need to change it.
- Lines usually end with a semicolon \`;\`.
- Comments start with \`//\` instead of \`#\`.

\`\`\`js
const name = "Ada";
let score = 10;
score = score + 5;
console.log(name, score);   // Ada 15
\`\`\``,
      example: {
        lang: 'javascript',
        code: code`
          // This is a comment
          const name = "Ada";
          let score = 10;
          score = score + 5;
          console.log(name, score);
          console.log("Hello from JavaScript!");
        `,
      },
      compare: {
        left: { lang: 'python', code: 'name = "Ada"\nscore = 10\nscore = score + 5\nprint(name, score)' },
        right: { lang: 'javascript', code: 'const name = "Ada";\nlet score = 10;\nscore = score + 5;\nconsole.log(name, score);' },
        same: ['`=` stores a value; names refer to values', 'Strings in quotes, numbers without', 'Several values print with a space between'],
        different: ['JS declares variables with `let` / `const`', '`console.log` instead of `print`', 'Semicolons end statements; `//` for comments'],
      },
    },
    {
      title: 'Types and template literals',
      minutes: 3,
      analogy: 'A **template literal** is JS\'s fill-in-the-blanks form — the same idea as a Python f-string, just with backticks and a `$`.',
      body: `JS types you'll use most:

| JS | Python equivalent |
|---|---|
| \`number\` (\`7\`, \`3.5\`) | int **and** float — JS has one number type |
| \`string\` | str |
| \`boolean\` (\`true\`/\`false\`, lowercase!) | bool |
| \`undefined\` / \`null\` | None (\`undefined\` = "never set") |

\`typeof x\` tells you the type: \`typeof 7\` → \`"number"\`.

A **template literal** uses backticks and \`\${...}\`:

\`\`\`js
console.log(\`\${name} has \${score} points\`);
\`\`\`

Compare values with \`===\` ("strictly equal"). Avoid \`==\`, which converts types in surprising ways: \`"5" == 5\` is true!`,
      example: {
        lang: 'javascript',
        code: code`
          const name = "Ada";
          const score = 15;
          console.log(\`\${name} has \${score} points\`);
          console.log(typeof score, typeof name, typeof true);
          console.log(7 / 2);          // 3.5 — one number type
          console.log("5" === 5, "5" == 5);
          let nothing;
          console.log(nothing);        // undefined
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Template greeting',
      minutes: 2,
      prompt: 'Using a **template literal** and the constant `user`, log `Welcome back, Sam!`.',
      starter: 'const user = "Sam";\n// log the welcome message\n',
      solution: 'const user = "Sam";\nconsole.log(`Welcome back, ${user}!`);\n',
      solutionExplain: 'Backticks make a template literal; `${user}` is filled in with "Sam".',
      hints: ['Use backticks `` ` `` (top-left of most keyboards), not quotes.', '`console.log(`Welcome back, ${user}!`);`'],
      tests: [
        out('Logs the welcome', 'Welcome back, Sam!', 'Use console.log with a template literal.'),
        check('Uses the variable', "const o = await RUN(CODE.replace('\"Sam\"', '\"Kai\"'));\nassert(o.trim() === 'Welcome back, Kai!', 'Use ${user} instead of typing Sam');", 'Put `${user}` in the template so it works for any name.'),
      ],
    },
    {
      title: 'let vs const',
      minutes: 2,
      prompt: `\`lives\` must change, so it should use \`let\`. Fix the declaration, then subtract 1 from \`lives\` twice and log it. Expected output:

\`\`\`
Lives left: 1
\`\`\``,
      starter: 'const lives = 3;\n// lose two lives, then log "Lives left: N"\n',
      solution: 'let lives = 3;\nlives = lives - 1;\nlives = lives - 1;\nconsole.log(`Lives left: ${lives}`);\n',
      solutionExplain: '`const` can\'t be reassigned (TypeError: Assignment to constant variable). `let` allows it.',
      hints: ['Try subtracting first and read the error — then change `const` to `let`.', '`let lives = 3;` then `lives = lives - 1;` twice.'],
      tests: [
        out('Logs Lives left: 1', 'Lives left: 1', 'Start at 3, lose 2 → 1.'),
        check('Uses let', "assert(/let\\s+lives/.test(CODE), 'Declare lives with let');", 'A variable that changes should use `let`.'),
      ],
    },
    {
      title: 'What type is it?',
      minutes: 1,
      prompt: 'Log the `typeof` each of the three constants, one per line. Expected:\n\n```\nnumber\nstring\nboolean\n```',
      starter: 'const a = 42;\nconst b = "42";\nconst c = false;\n',
      solution: 'const a = 42;\nconst b = "42";\nconst c = false;\nconsole.log(typeof a);\nconsole.log(typeof b);\nconsole.log(typeof c);\n',
      solutionExplain: '`typeof` returns the type name as a string. Quotes make "42" a string.',
      hints: ['`typeof` goes before the value: `typeof a`.', '`console.log(typeof a);` and the same for b and c.'],
      tests: [out('Logs the three types', 'number\nstring\nboolean', 'One typeof per line, in order a, b, c.')],
    },
  ],
  challenges: [
    {
      title: 'Profile card in JS',
      minutes: 4,
      prompt: `Remember the Python profile card from World 1? Build it in JS. Using the constants (not retyped values), log:

\`\`\`
Name: Ada
Age: 36
Likes JS: true
Next birthday: 37
\`\`\`

Note: JS prints booleans in lowercase.`,
      starter: 'const name = "Ada";\nconst age = 36;\nconst likesJs = true;\n\n// log the card\n',
      solution: 'const name = "Ada";\nconst age = 36;\nconst likesJs = true;\n\nconsole.log(`Name: ${name}`);\nconsole.log(`Age: ${age}`);\nconsole.log(`Likes JS: ${likesJs}`);\nconsole.log(`Next birthday: ${age + 1}`);\n',
      solutionExplain: 'Each line is a template literal. Math works inside `${...}`, just like in an f-string.',
      hints: ['Four console.log lines, each a template literal with one constant.', '`console.log(`Next birthday: ${age + 1}`);` — math inside `${}` works.'],
      tests: [
        out('Prints the card', 'Name: Ada\nAge: 36\nLikes JS: true\nNext birthday: 37', 'Check labels, colons and the next-birthday math.'),
        check(
          'Uses the constants',
          "const o = await RUN(CODE.replace('\"Ada\"', '\"Linus\"').replace('36', '54').replace('likesJs = true', 'likesJs = false'));\nassert(o.trim() === 'Name: Linus\\nAge: 54\\nLikes JS: false\\nNext birthday: 55', 'Card did not update: ' + o);",
          'When the constants change, the card must change too.',
        ),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this log?',
      code: 'let x = 4;\nx = x * 2;\nconsole.log(`x is ${x}`);',
      codeLang: 'javascript',
      answers: ['x is 8'],
      explain: 'x becomes 8 and the template literal fills it in.',
    },
    {
      kind: 'bug',
      prompt: 'Why does this crash?',
      code: 'const count = 0;\ncount = count + 1;',
      codeLang: 'javascript',
      options: ['count should be a string', '`const` can\'t be reassigned — use `let`', 'Missing console.log', 'JS has no + operator'],
      answer: 1,
      explain: 'TypeError: Assignment to constant variable. Use `let` for values that change.',
    },
    {
      kind: 'concept',
      prompt: 'What is the JS version of Python\'s `print("hi")`?',
      options: ['`print("hi");`', '`console.log("hi");`', '`echo("hi");`', '`log.console("hi");`'],
      answer: 1,
      explain: '`console.log` writes to the console.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this log?',
      code: 'console.log(5 === "5");',
      codeLang: 'javascript',
      answers: ['false'],
      explain: '`===` checks type too: a number is never strictly equal to a string.',
    },
  ],
});
