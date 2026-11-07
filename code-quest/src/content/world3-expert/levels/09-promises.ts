import { check, code, defineLevel } from '../../dsl';

// Mock fetch: resolves after a short delay, like a real network call.
export const MOCK_FETCH = code`
  // --- Mock server (pretends to be the internet; don't edit) ---
  const DB = {
    "/user/1": { id: 1, name: "Ada", teamId: 10 },
    "/user/2": { id: 2, name: "Alan", teamId: 20 },
    "/team/10": { id: 10, name: "Engines", city: "London" },
    "/team/20": { id: 20, name: "Codebreakers", city: "Bletchley" },
    "/weather/London": { temp: 14 },
    "/weather/Bletchley": { temp: 11 },
  };
  function fakeFetch(url) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = DB[url];
        resolve({
          ok: found !== undefined,
          status: found ? 200 : 404,
          json: () => Promise.resolve(found ?? { error: "not found" }),
        });
      }, 20);
    });
  }
  // ---------------------------------------------------------------
`;

export default defineLevel({
  id: 'w3.l9',
  title: 'Promises',
  icon: '⏳',
  summary: 'Asynchronous JS: waiting without freezing',
  lang: 'javascript',
  teaches: ['promises'],
  requires: ['apis', 'js-functions', 'js-objects', 'json'],
  learn: [
    {
      title: 'Asynchronous code',
      minutes: 3,
      analogy: 'Ordering at a busy café, you get a **buzzer** (a Promise). You don\'t stand frozen at the counter — you sit down, and when it buzzes, you collect your food.',
      body: `Network requests take time. If JS waited by freezing, the whole web page would lock up. Instead, slow operations are **asynchronous**: they start now and finish later.

A **Promise** is an object representing a value that will arrive later. It's either **pending**, **fulfilled** (has a value) or **rejected** (has an error).

\`.then(fn)\` says "when it's ready, run fn with the value". \`.catch(fn)\` handles errors:

\`\`\`js
fakeFetch("/user/1")
  .then(res => res.json())       // json() is async too!
  .then(user => console.log(user.name))
  .catch(err => console.log("Failed:", err.message));
console.log("This prints FIRST");
\`\`\`

Code after the call runs **immediately**; the \`.then\` callbacks run later.`,
      example: {
        lang: 'javascript',
        code: `${MOCK_FETCH}\nfakeFetch("/user/1")\n  .then(res => res.json())\n  .then(user => console.log("Got user:", user.name))\n  .catch(err => console.log("Failed:", err.message));\n\nconsole.log("This prints FIRST, while we wait...");\n`,
      },
    },
    {
      title: 'Chaining and errors',
      minutes: 3,
      analogy: 'A **relay race**: each runner (`.then`) waits for the baton from the one before. If anyone drops it, the race jumps straight to the `.catch` medic.',
      body: `If a \`.then\` callback **returns a Promise**, the next \`.then\` waits for it. That lets you do steps in order without nesting:

\`\`\`js
fakeFetch("/user/1")
  .then(res => res.json())
  .then(user => fakeFetch(\`/team/\${user.teamId}\`))
  .then(res => res.json())
  .then(team => console.log(team.name));
\`\`\`

A \`fetch\` that gets a 404 still **succeeds** — check \`res.ok\` yourself. To signal failure, \`throw new Error("...")\` inside a \`.then\`; that skips the rest of the chain and lands in \`.catch\`.

Make your own Promise with \`Promise.resolve(value)\` or \`Promise.reject(new Error("..."))\`.`,
      example: {
        lang: 'javascript',
        code: `${MOCK_FETCH}\nfakeFetch("/user/99")\n  .then(res => {\n    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n    return res.json();\n  })\n  .then(user => console.log("never runs", user))\n  .catch(err => console.log("Caught:", err.message));\n`,
      },
    },
  ],
  practice: [
    {
      title: 'Get a name with .then',
      minutes: 3,
      prompt: 'Write `getName(id)` that **returns a Promise** resolving to the user\'s name: fetch `/user/ID`, parse the JSON, then return the `name`.',
      starter: `${MOCK_FETCH}\nfunction getName(id) {\n  // return fakeFetch(...).then(...).then(...)\n}\n`,
      solution: `${MOCK_FETCH}\nfunction getName(id) {\n  return fakeFetch(\`/user/\${id}\`)\n    .then(res => res.json())\n    .then(user => user.name);\n}\n`,
      solutionExplain: 'Returning the whole chain hands the caller a Promise of the final value. Each `.then` transforms the value for the next one.',
      hints: ['Start with `return fakeFetch(`/user/${id}`)` — the `return` matters!', 'Chain `.then(res => res.json())` then `.then(user => user.name)`.'],
      tests: [
        check('Resolves to the name', "const p = getName(2);\nassert(p instanceof Promise, 'getName must return a Promise');\nassert((await p) === 'Alan', 'Got ' + (await p));", 'getName(2) should resolve to "Alan".'),
      ],
    },
    {
      title: 'Reject on 404',
      minutes: 3,
      prompt: 'Write `getUser(id)` returning a Promise of the user object — but if `res.ok` is false, **throw** `new Error("User not found")` so the Promise rejects.',
      starter: `${MOCK_FETCH}\nfunction getUser(id) {\n  return fakeFetch(\`/user/\${id}\`).then(res => res.json());\n}\n`,
      solution: `${MOCK_FETCH}\nfunction getUser(id) {\n  return fakeFetch(\`/user/\${id}\`).then(res => {\n    if (!res.ok) throw new Error("User not found");\n    return res.json();\n  });\n}\n`,
      solutionExplain: 'Throwing inside `.then` turns the Promise into a rejected one, so callers\' `.catch` runs instead of getting `{error: ...}` as if it were a user.',
      hints: ['Use a `{ }` arrow body in the `.then` so you can write an `if`.', '`if (!res.ok) throw new Error("User not found"); return res.json();`'],
      tests: [
        check('Resolves for a real user', "const u = await getUser(1);\nassert(u.name === 'Ada', JSON.stringify(u));", 'getUser(1) → the Ada object.'),
        check('Rejects on 404', "let msg = null;\nawait getUser(7).catch(e => { msg = e.message; });\nassert(msg === 'User not found', 'Rejected with: ' + msg);", 'getUser(7) must reject with Error("User not found").'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Chain three requests',
      minutes: 6,
      prompt: `Write \`teamWeather(userId)\` returning a Promise of a sentence like:

\`\`\`
Ada's team Engines is in London, where it is 14°C
\`\`\`

Steps (each depends on the previous): \`/user/ID\` → \`/team/TEAMID\` → \`/weather/CITY\`.

If **any** response isn't ok, the Promise should resolve to \`"Could not load team weather"\` instead (use \`.catch\` at the end). Use \`.then\` chaining (no async/await yet).`,
      starter: `${MOCK_FETCH}\nfunction teamWeather(userId) {\n}\n`,
      solution: `${MOCK_FETCH}\nfunction getJson(url) {\n  return fakeFetch(url).then(res => {\n    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n    return res.json();\n  });\n}\n\nfunction teamWeather(userId) {\n  let user;\n  let team;\n  return getJson(\`/user/\${userId}\`)\n    .then(u => {\n      user = u;\n      return getJson(\`/team/\${u.teamId}\`);\n    })\n    .then(t => {\n      team = t;\n      return getJson(\`/weather/\${t.city}\`);\n    })\n    .then(w => \`\${user.name}'s team \${team.name} is in \${team.city}, where it is \${w.temp}°C\`)\n    .catch(() => "Could not load team weather");\n}\n`,
      solutionExplain: 'A small helper `getJson` handles "fetch + check ok + parse" once. Each `.then` returns the next request, so the chain runs in order. Variables outside the chain keep earlier results for the final sentence, and one `.catch` covers every step.',
      hints: [
        'Write a helper `getJson(url)` that fetches, throws if `!res.ok`, and returns `res.json()`. Then chain three `getJson` calls, returning each from its `.then`.',
        'Keep `user` and `team` in variables declared before the chain. End with `.catch(() => "Could not load team weather")`.',
      ],
      tests: [
        check('User 1', "const s = await teamWeather(1);\nassert(s === \"Ada's team Engines is in London, where it is 14°C\", s);", 'Follow user → team → weather.'),
        check('User 2', "const s = await teamWeather(2);\nassert(s === \"Alan's team Codebreakers is in Bletchley, where it is 11°C\", s);", 'Works for a different user.'),
        check('Missing user', "const s = await teamWeather(5);\nassert(s === 'Could not load team weather', s);", 'A 404 anywhere resolves to the fallback message.'),
        check('No async/await yet', "const body = CODE.split('// ----').pop();\nassert(!/\\bawait\\b|\\basync\\b/.test(body), 'Use .then chaining here');", 'Practice `.then` — async/await is next level.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'In what order are the letters logged? (One per line.)',
      code: 'console.log("A");\nPromise.resolve().then(() => console.log("B"));\nconsole.log("C");',
      codeLang: 'javascript',
      answers: ['A\nC\nB'],
      explain: '.then callbacks always run later, after the current code finishes — even for an already-resolved Promise.',
    },
    {
      kind: 'bug',
      prompt: '`getName(1).then(n => console.log(n))` crashes: "Cannot read properties of undefined (reading \'then\')". Why?',
      code: 'function getName(id) {\n  fakeFetch(`/user/${id}`).then(r => r.json()).then(u => u.name);\n}',
      codeLang: 'javascript',
      options: ['fakeFetch is broken', 'The function doesn\'t `return` the Promise chain, so it returns undefined', '.then needs async', 'u.name is wrong'],
      answer: 1,
      explain: 'Without `return`, callers get undefined. Return the chain.',
    },
    {
      kind: 'concept',
      prompt: 'A fetch that gets HTTP 404 ...',
      options: ['Rejects automatically', 'Resolves; you must check res.ok yourself', 'Freezes the page', 'Retries forever'],
      answer: 1,
      explain: 'fetch only rejects on network failure. HTTP errors still resolve — check `res.ok`.',
    },
  ],
});
