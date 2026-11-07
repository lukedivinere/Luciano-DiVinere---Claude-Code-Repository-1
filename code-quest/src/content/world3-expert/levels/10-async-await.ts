import { check, defineLevel } from '../../dsl';
import { MOCK_FETCH } from './09-promises';

export default defineLevel({
  id: 'w3.l10',
  title: 'async / await',
  icon: '⚙️',
  summary: 'Write async code that reads like normal code',
  lang: 'javascript',
  teaches: ['async-await'],
  requires: ['promises', 'try-except'],
  learn: [
    {
      title: 'await: pause until ready',
      minutes: 3,
      analogy: 'Same café buzzer — but instead of writing instructions on a sticky note for later (`.then`), you just say "**wait here** until it buzzes", and the rest of the café keeps working.',
      body: `\`async\` / \`await\` is a nicer way to write Promise code:

\`\`\`js
async function getTeamName(id) {
  const res = await fakeFetch(\`/user/\${id}\`);
  const user = await res.json();
  return user.name;
}
\`\`\`

- \`await promise\` pauses **this function** until the Promise settles, then gives you its value.
- You can only use \`await\` inside an \`async\` function.
- An \`async\` function **always returns a Promise**.

Errors work with ordinary \`try\` / \`catch\` — just like Python's try/except:

\`\`\`js
try {
  const user = await getUser(99);
} catch (err) {
  console.log("Failed:", err.message);
}
\`\`\``,
      example: {
        lang: 'javascript',
        code: `${MOCK_FETCH}\nasync function getName(id) {\n  const res = await fakeFetch(\`/user/\${id}\`);\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  const user = await res.json();\n  return user.name;\n}\n\nasync function main() {\n  console.log(await getName(1));\n  try {\n    await getName(9);\n  } catch (err) {\n    console.log("Caught:", err.message);\n  }\n}\nmain();\n`,
      },
    },
    {
      title: 'In parallel with Promise.all',
      minutes: 2,
      analogy: 'Ordering three dishes: waiting for each one before ordering the next is slow. Order all three at once and wait for **the whole tray**.',
      body: `\`await\` in a loop runs requests **one after another**. If they don't depend on each other, start them all and wait once:

\`\`\`js
const [a, b] = await Promise.all([getName(1), getName(2)]);
\`\`\`

\`Promise.all([...])\` takes an array of Promises and resolves to an array of results **in the same order**. If any one rejects, the whole thing rejects.

Combined with \`map\`:

\`\`\`js
const names = await Promise.all(ids.map(id => getName(id)));
\`\`\`

\`Promise.allSettled\` waits for all and tells you which succeeded — useful when some may fail.`,
      example: {
        lang: 'javascript',
        code: `${MOCK_FETCH}\nasync function getName(id) {\n  const res = await fakeFetch(\`/user/\${id}\`);\n  return (await res.json()).name;\n}\n\nasync function main() {\n  const start = Date.now();\n  const names = await Promise.all([1, 2].map(id => getName(id)));\n  console.log(names, "in about", Date.now() - start, "ms (parallel)");\n}\nmain();\n`,
      },
    },
  ],
  practice: [
    {
      title: 'Convert .then to await',
      minutes: 3,
      prompt: 'Rewrite `getCity(teamId)` using `async`/`await` instead of `.then`. It returns the team\'s city.',
      starter: `${MOCK_FETCH}\nfunction getCity(teamId) {\n  return fakeFetch(\`/team/\${teamId}\`)\n    .then(res => res.json())\n    .then(team => team.city);\n}\n`,
      solution: `${MOCK_FETCH}\nasync function getCity(teamId) {\n  const res = await fakeFetch(\`/team/\${teamId}\`);\n  const team = await res.json();\n  return team.city;\n}\n`,
      solutionExplain: 'Each `.then` step becomes an `await` line; the function is marked `async`.',
      hints: ['Add `async` before `function`, then `const res = await fakeFetch(...)`.', '`const team = await res.json(); return team.city;`'],
      tests: [
        check('Returns the city', "assert((await getCity(20)) === 'Bletchley');", 'getCity(20) → "Bletchley".'),
        check('Uses await', "const body = CODE.split('// ----').pop();\nassert(/\\bawait\\b/.test(body) && !/\\.then\\(/.test(body), 'Use await instead of .then');", 'Use `await`, not `.then`.'),
      ],
    },

    {
      title: 'One at a time, in order',
      minutes: 3,
      prompt: 'Write `async function namesInOrder(ids)` that fetches each user **one after another** with `for...of` and `await`, and returns their names. (Sometimes order matters more than speed — e.g. each request depends on the last.)',
      starter: `${MOCK_FETCH}\nasync function namesInOrder(ids) {\n  const names = [];\n  // loop with for...of and await each request\n  return names;\n}\n`,
      solution: `${MOCK_FETCH}\nasync function namesInOrder(ids) {\n  const names = [];\n  for (const id of ids) {\n    const res = await fakeFetch(\`/user/\${id}\`);\n    const user = await res.json();\n    names.push(user.name);\n  }\n  return names;\n}\n`,
      solutionExplain: 'Unlike `forEach`, a `for...of` loop inside an async function really waits at each `await`, so requests run in sequence.',
      hints: ['`for (const id of ids) { ... }` inside the async function.', 'In the loop: `const res = await fakeFetch(...)`, `const user = await res.json()`, `names.push(user.name)`.'],
      tests: [check('Names in order', "const n = await namesInOrder([2, 1]);\nassert(JSON.stringify(n) === JSON.stringify(['Alan', 'Ada']), JSON.stringify(n));", 'namesInOrder([2, 1]) → ["Alan", "Ada"].')],
    },
  ],
  challenges: [
    {
      title: 'Parallel dashboard loader',
      minutes: 7,
      prompt: `Write \`async function loadDashboard(userIds)\` that loads several users **in parallel** and returns:

\`\`\`js
{
  users: ["Ada", "Alan"],      // names of users that loaded, in the given order
  failed: [7],                 // ids that returned 404
  cities: ["Bletchley", "London"]   // unique team cities of loaded users, sorted
}
\`\`\`

- Write a helper \`loadUser(id)\` that returns \`{ id, user }\` on success or \`{ id, user: null }\` on 404 — so one bad id doesn't fail everything.
- Use \`Promise.all\` for the users, then again for their teams.
- The hidden test checks the requests really run in parallel (it measures the time).`,
      starter: `${MOCK_FETCH}\nasync function loadDashboard(userIds) {\n}\n`,
      solution: `${MOCK_FETCH}\nasync function loadUser(id) {\n  const res = await fakeFetch(\`/user/\${id}\`);\n  if (!res.ok) return { id, user: null };\n  return { id, user: await res.json() };\n}\n\nasync function loadDashboard(userIds) {\n  const results = await Promise.all(userIds.map(id => loadUser(id)));\n  const loaded = results.filter(r => r.user !== null).map(r => r.user);\n  const failed = results.filter(r => r.user === null).map(r => r.id);\n\n  const teams = await Promise.all(\n    loaded.map(async user => (await fakeFetch(\`/team/\${user.teamId}\`)).json()),\n  );\n  const cities = [...new Set(teams.map(t => t.city))].sort();\n\n  return { users: loaded.map(u => u.name), failed, cities };\n}\n`,
      solutionExplain: '`loadUser` never rejects — it reports failure in its result, so `Promise.all` always completes. Two parallel rounds (users, then their teams) keep it fast. `new Set(...)` removes duplicate cities, `[...set]` turns it back into an array, and `.sort()` orders it.',
      hints: [
        '`const results = await Promise.all(userIds.map(id => loadUser(id)));` then split into loaded users and failed ids with `filter`/`map`.',
        'Teams: `await Promise.all(loaded.map(async u => (await fakeFetch(`/team/${u.teamId}`)).json()))`. Unique sorted cities: `[...new Set(teams.map(t => t.city))].sort()`.',
      ],
      tests: [
        check('Loads users and cities', "const d = await loadDashboard([2, 7, 1]);\nassert(JSON.stringify(d.users) === JSON.stringify(['Alan', 'Ada']), 'users: ' + JSON.stringify(d.users));\nassert(JSON.stringify(d.failed) === JSON.stringify([7]), 'failed: ' + JSON.stringify(d.failed));\nassert(JSON.stringify(d.cities) === JSON.stringify(['Bletchley', 'London']), 'cities: ' + JSON.stringify(d.cities));", 'users in given order, failed ids, unique sorted cities.'),
        check('Duplicate cities appear once', "const d = await loadDashboard([1, 1, 1]);\nassert(JSON.stringify(d.cities) === JSON.stringify(['London']), JSON.stringify(d.cities));", 'Same team three times → one city.'),
        check('Runs in parallel', "const start = Date.now();\nawait loadDashboard([1, 2, 1, 2, 1, 2, 1, 2]);\nconst ms = Date.now() - start;\nassert(ms < 120, 'Took ' + ms + 'ms — are you awaiting inside a loop?');", '8 users should take about 2 network delays, not 16. Use Promise.all.'),
        check('Empty input', "const d = await loadDashboard([]);\nassert(d.users.length === 0 && d.failed.length === 0 && d.cities.length === 0);", 'No ids → empty arrays.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'bug',
      prompt: 'This gives `SyntaxError: await is only valid in async functions`. Fix?',
      code: 'function load() {\n  const res = await fakeFetch("/user/1");\n}',
      codeLang: 'javascript',
      options: ['Remove await', 'Add `async` before `function`', 'Wrap in setTimeout', 'Use var'],
      answer: 1,
      explain: '`await` only works inside an `async` function.',
    },
    {
      kind: 'concept',
      prompt: 'What does an `async` function return?',
      options: ['Whatever value you return, directly', 'Always a Promise of that value', 'undefined', 'An array'],
      answer: 1,
      explain: 'async functions always return a Promise, so callers must await (or .then) them.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What is logged?',
      code: 'async function f() { return 5; }\nf().then(x => console.log(x * 2));',
      codeLang: 'javascript',
      answers: ['10'],
      explain: 'f() returns a Promise of 5; .then receives 5 and logs 10.',
    },
  ],
});
