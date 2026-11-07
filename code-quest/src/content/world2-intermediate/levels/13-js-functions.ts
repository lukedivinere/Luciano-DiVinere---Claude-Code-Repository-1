import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w2.l13',
  title: 'JS Functions',
  icon: '🏹',
  summary: 'function declarations, arrow functions, defaults',
  lang: 'javascript',
  teaches: ['js-functions'],
  requires: ['js-control', 'functions', 'return', 'parameters'],
  learn: [
    {
      title: 'Two ways to write a function',
      minutes: 3,
      analogy: 'An **arrow function** is the same recipe card as a regular function, written in **shorthand** — handy for small, one-line recipes.',
      body: `A **function declaration**:

\`\`\`js
function add(a, b) {
  return a + b;
}
\`\`\`

An **arrow function** stored in a constant — shorter, very common in modern JS:

\`\`\`js
const add = (a, b) => {
  return a + b;
};
const add2 = (a, b) => a + b;   // one expression: return is automatic
const double = n => n * 2;      // one parameter: brackets optional
\`\`\`

**Default parameters** work like Python: \`function greet(name, greeting = "Hello")\`.

One difference: a JS function without \`return\` gives \`undefined\` (Python gives \`None\`). And calling with too few arguments doesn't crash — missing ones are just \`undefined\`.`,
      example: {
        lang: 'javascript',
        code: code`
          function add(a, b) {
            return a + b;
          }
          const double = n => n * 2;
          const greet = (name, greeting = "Hello") => \`\${greeting}, \${name}!\`;

          console.log(add(2, 3), double(21));
          console.log(greet("Ada"), greet("Alan", "Hi"));
          console.log(add(1));   // b is undefined → NaN ("not a number")
        `,
      },
      compare: {
        left: { lang: 'python', code: 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\ndouble = lambda n: n * 2' },
        right: { lang: 'javascript', code: 'function greet(name, greeting = "Hello") {\n  return `${greeting}, ${name}!`;\n}\nconst double = n => n * 2;' },
        same: ['Parameters, arguments, `return`', 'Default parameter values', 'Functions can be stored in variables'],
        different: ['`function` keyword and `{ }` instead of `def` and `:`', 'Arrow functions `=>` are everywhere in JS', 'Missing arguments become `undefined` instead of an error'],
      },
    },
  ],
  practice: [
    {
      title: 'Arrow square',
      minutes: 1,
      prompt: 'Create an **arrow function** `square` that returns n × n.',
      starter: '// const square = ...\n',
      solution: 'const square = n => n * n;\n',
      solutionExplain: 'A one-expression arrow function returns its expression automatically.',
      hints: ['Arrow syntax: `const name = (params) => expression;`', '`const square = n => n * n;`'],
      tests: [
        call('square', [4], 16, 'square(4) → 16'),
        call('square', [-3], 9, 'square(-3) → 9'),
        check('Is an arrow function', "assert(CODE.includes('=>'), 'Use the => arrow syntax');", 'Write it with `=>`.'),
      ],
    },
    {
      title: 'Greeting with a default',
      minutes: 2,
      prompt: 'Write `greet(name, greeting = "Hello")` that returns `"GREETING, NAME!"`. `greet("Ada")` → `"Hello, Ada!"`.',
      starter: 'function greet(name, greeting) {\n  return `${greeting}, ${name}!`;\n}\n',
      solution: 'function greet(name, greeting = "Hello") {\n  return `${greeting}, ${name}!`;\n}\n',
      solutionExplain: 'Without a default, `greeting` would be `undefined`, giving "undefined, Ada!".',
      hints: ['Give the second parameter a default with `=`.', '`function greet(name, greeting = "Hello")`'],
      tests: [call('greet', ['Ada'], 'Hello, Ada!', 'Uses the default greeting.'), call('greet', ['Alan', 'Hi'], 'Hi, Alan!', 'Uses the given greeting.')],
    },
  ],
  challenges: [
    {
      title: 'Port your Python functions',
      minutes: 5,
      prompt: `Translate two World 1 functions to JavaScript:

**\`isLeapYear(year)\`** → \`true\`/\`false\` (divisible by 4, except centuries unless divisible by 400).

**\`countVowels(text)\`** → number of vowels, any case.

JS helpers you'll need: \`text.toLowerCase()\` (Python's \`.lower()\`), and \`"aeiou".includes(ch)\` (Python's \`ch in "aeiou"\`). You can loop over a string with \`for (const ch of text)\`.`,
      starter: 'function isLeapYear(year) {\n}\n\nfunction countVowels(text) {\n}\n',
      solution: 'function isLeapYear(year) {\n  if (year % 400 === 0) return true;\n  if (year % 100 === 0) return false;\n  return year % 4 === 0;\n}\n\nfunction countVowels(text) {\n  let count = 0;\n  for (const ch of text.toLowerCase()) {\n    if ("aeiou".includes(ch)) {\n      count++;\n    }\n  }\n  return count;\n}\n',
      solutionExplain: 'Line-for-line the same logic as Python. Note `if (...) return true;` — braces can be skipped for a single statement, though many style guides prefer always using them.',
      hints: [
        'isLeapYear: check `% 400`, then `% 100`, then `% 4`, returning booleans. countVowels: loop `for (const ch of text.toLowerCase())`.',
        'Inside the vowel loop: `if ("aeiou".includes(ch)) { count++; }` and `return count;` after.',
      ],
      tests: [
        call('isLeapYear', [2024], true, '2024 → true'),
        call('isLeapYear', [1900], false, '1900 → false (century not divisible by 400)'),
        call('isLeapYear', [2000], true, '2000 → true'),
        call('isLeapYear', [2023], false, '2023 → false'),
        call('countVowels', ['Hello World'], 3, 'e, o, o'),
        call('countVowels', ['AEIOU'], 5, 'Uppercase vowels count.'),
        call('countVowels', [''], 0, 'Empty string → 0'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this log?',
      code: 'const triple = x => x * 3;\nconsole.log(triple(triple(2)));',
      codeLang: 'javascript',
      answers: ['18'],
      explain: 'triple(2) = 6, triple(6) = 18.',
    },
    {
      kind: 'bug',
      prompt: 'This logs `undefined`. Why?',
      code: 'const add = (a, b) => {\n  a + b;\n};\nconsole.log(add(2, 3));',
      codeLang: 'javascript',
      options: ['Arrow functions can\'t add', 'With `{ }` braces you must write `return a + b;`', 'Missing semicolon after `}`', 'add needs the function keyword'],
      answer: 1,
      explain: 'Only the brace-less form `(a, b) => a + b` returns automatically.',
    },
    {
      kind: 'concept',
      prompt: 'What does a JS function return if it has no `return` statement?',
      options: ['null', '0', 'undefined', 'An error'],
      answer: 2,
      explain: '`undefined` — JS\'s version of Python\'s None for "no value".',
    },
  ],
});
