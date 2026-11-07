import { call, check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w2.l15',
  title: 'JS Objects',
  icon: '🗂️',
  summary: 'Objects vs dicts, Object.keys / entries, nesting',
  lang: 'javascript',
  teaches: ['js-objects'],
  requires: ['js-arrays', 'dicts', 'nested-data'],
  learn: [
    {
      title: 'Objects: JS dictionaries',
      minutes: 3,
      analogy: 'A JS object is a **labelled filing cabinet** — the same idea as a Python dict, with a slightly different handle on the drawers.',
      body: `An **object** stores key → value pairs:

\`\`\`js
const user = { name: "Ada", age: 36 };
\`\`\`

Keys don't need quotes (if they're simple words). Read and write values with **dot notation** or brackets:

\`\`\`js
user.name          // "Ada"
user["age"]        // 36 — brackets when the key is in a variable
user.city = "London";   // add a key
\`\`\`

A missing key gives \`undefined\` (no KeyError!). Use \`key in obj\` to check, or \`obj.city ?? "Unknown"\` for a default — like Python's \`.get(key, default)\`.

Objects and arrays nest freely: \`data.users[0].name\`. This shape is exactly what **JSON** (the web's data format) looks like.`,
      example: {
        lang: 'javascript',
        code: code`
          const user = { name: "Ada", age: 36 };
          console.log(user.name, user["age"]);
          user.city = "London";
          console.log(user);
          console.log(user.email, user.email ?? "no email");
          const data = { users: [{ name: "Ada" }, { name: "Alan" }] };
          console.log(data.users[1].name);
        `,
      },
      compare: {
        left: { lang: 'python', code: 'user = {"name": "Ada", "age": 36}\nprint(user["name"])\nuser["city"] = "London"\nprint(user.get("email", "none"))' },
        right: { lang: 'javascript', code: 'const user = { name: "Ada", age: 36 };\nconsole.log(user.name);\nuser.city = "London";\nconsole.log(user.email ?? "none");' },
        same: ['Key → value pairs in `{ }`', 'Add or change with assignment', 'Nest lists/arrays and dicts/objects'],
        different: ['JS keys often skip quotes; dot notation `user.name`', 'Missing key → `undefined` instead of KeyError', '`??` gives a default instead of `.get()`'],
      },
    },
    {
      title: 'Looping over objects',
      minutes: 2,
      analogy: 'To go through every drawer in the cabinet, first ask for the **list of labels** (keys) or the **list of label + contents** pairs (entries).',
      body: `- \`Object.keys(obj)\` → array of keys (Python: \`list(d)\`)
- \`Object.values(obj)\` → array of values
- \`Object.entries(obj)\` → array of \`[key, value]\` pairs (Python: \`d.items()\`)

\`\`\`js
for (const [key, value] of Object.entries(scores)) {
  console.log(key, value);
}
\`\`\`

\`[key, value]\` **unpacks** each pair — like \`for k, v in d.items()\`.

The counting pattern in JS:

\`\`\`js
counts[word] = (counts[word] ?? 0) + 1;
\`\`\``,
      example: {
        lang: 'javascript',
        code: code`
          const scores = { ada: 90, alan: 75 };
          console.log(Object.keys(scores), Object.values(scores));
          for (const [name, score] of Object.entries(scores)) {
            console.log(\`\${name}: \${score}\`);
          }
          const counts = {};
          for (const w of ["hi", "yo", "hi"]) {
            counts[w] = (counts[w] ?? 0) + 1;
          }
          console.log(counts);
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Contact card',
      minutes: 2,
      prompt: 'Add an `email` of `"ada@example.com"` to `contact`, then log `Ada <ada@example.com>` using the object\'s values.',
      starter: 'const contact = { name: "Ada", phone: "555-0101" };\n',
      solution: 'const contact = { name: "Ada", phone: "555-0101" };\ncontact.email = "ada@example.com";\nconsole.log(`${contact.name} <${contact.email}>`);\n',
      solutionExplain: 'Assigning to a new key adds it; dot notation reads values inside the template literal.',
      hints: ['Add with `contact.email = ...`.', '`console.log(`${contact.name} <${contact.email}>`);`'],
      tests: [out('Logs name and email', 'Ada <ada@example.com>', 'Format: name, space, email in < >.'), check('Email was added', "assert(contact.email === 'ada@example.com');", 'Store the email on the object.')],
    },
    {
      title: 'List the entries',
      minutes: 2,
      prompt: 'Log each item of `stock` as `NAME: QTY`, one per line, using `Object.entries` and `for...of`.',
      starter: 'const stock = { apples: 3, pears: 0, plums: 12 };\n',
      solution: 'const stock = { apples: 3, pears: 0, plums: 12 };\nfor (const [name, qty] of Object.entries(stock)) {\n  console.log(`${name}: ${qty}`);\n}\n',
      solutionExplain: '`Object.entries` gives [key, value] pairs which unpack into `name` and `qty`.',
      hints: ['`for (const [name, qty] of Object.entries(stock)) { ... }`', 'Inside: `console.log(`${name}: ${qty}`);`'],
      tests: [out('Logs three lines', 'apples: 3\npears: 0\nplums: 12', 'One "name: qty" line per item, in order.')],
    },
  ],
  challenges: [
    {
      title: 'Word counter in JS',
      minutes: 5,
      prompt: `Port \`word_frequency\` from World 2 Level 1 to JS:

\`wordCount(text)\` returns an object counting each lowercase word. Words are separated by whitespace — \`text.toLowerCase().split(/\\s+/)\` splits on any run of spaces. Ignore empty strings (they appear if the text is empty or starts/ends with spaces).

\`wordCount("The cat and the hat")\` → \`{ the: 2, cat: 1, and: 1, hat: 1 }\`

Then write \`topWord(text)\` returning the most frequent word (first one wins ties), or \`null\` for empty text.`,
      starter: 'function wordCount(text) {\n}\n\nfunction topWord(text) {\n}\n',
      solution: 'function wordCount(text) {\n  const counts = {};\n  for (const word of text.toLowerCase().split(/\\s+/)) {\n    if (word === "") continue;\n    counts[word] = (counts[word] ?? 0) + 1;\n  }\n  return counts;\n}\n\nfunction topWord(text) {\n  const counts = wordCount(text);\n  let best = null;\n  for (const [word, n] of Object.entries(counts)) {\n    if (best === null || n > counts[best]) {\n      best = word;\n    }\n  }\n  return best;\n}\n',
      solutionExplain: '`continue` skips to the next loop round (here: skipping empty strings). Objects keep keys in insertion order, so walking `Object.entries` and only replacing on a strictly bigger count keeps the first word on ties.',
      hints: [
        'Use the JS counting pattern `counts[word] = (counts[word] ?? 0) + 1;`. Skip `""` with `if (word === "") continue;`.',
        '`topWord`: call `wordCount(text)`, loop `Object.entries(...)`, and replace `best` only when the count is strictly greater.',
      ],
      tests: [
        call('wordCount', ['The cat and the hat'], { the: 2, cat: 1, and: 1, hat: 1 }, 'Lowercase, then count.'),
        call('wordCount', ['  go  Go GO '], { go: 3 }, 'Extra spaces must not create empty-string words.'),
        call('wordCount', [''], {}, 'Empty text → {}.'),
        call('topWord', ['b a a b c'], 'b', 'Tie between b and a → b came first.'),
        call('topWord', [''], null, 'Empty text → null.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this log?',
      code: 'const p = { x: 1, y: 2 };\np.z = p.x + p.y;\nconsole.log(Object.keys(p).length, p.z);',
      codeLang: 'javascript',
      answers: ['3 3'],
      explain: 'p now has keys x, y, z (3 keys), and z is 1 + 2 = 3.',
    },
    {
      kind: 'bug',
      prompt: 'This logs `undefined`. Why?',
      code: 'const key = "age";\nconst user = { age: 30 };\nconsole.log(user.key);',
      codeLang: 'javascript',
      options: ['Objects can\'t hold numbers', '`user.key` looks for a key literally named "key" — use `user[key]`', 'key should be let', 'Missing quotes around age'],
      answer: 1,
      explain: 'Dot notation uses the literal name. When the key is in a variable, use brackets.',
    },
    {
      kind: 'concept',
      prompt: 'What does reading a missing key give you in JS?',
      options: ['KeyError', 'null', 'undefined', '0'],
      answer: 2,
      explain: 'JS returns `undefined` quietly — so typos in keys can go unnoticed. Be careful!',
    },
  ],
});
