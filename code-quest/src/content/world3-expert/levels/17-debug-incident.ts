import { call, check, code, defineLevel, rows } from '../../dsl';
import { SANDBOX_DB as DB } from '../../sandboxDb';
import { MOCK_FETCH } from './09-promises';

export default defineLevel({
  id: 'w3.l17',
  title: 'Debug: Production Incident',
  kind: 'debug',
  icon: '🚨',
  summary: 'Debug Mode: three real-world bugs in Python, JS and SQL',
  lang: 'python',
  teaches: [],
  requires: ['async-await', 'sql-join', 'refactoring', 'testing'],
  learn: [
    {
      title: 'Incident response',
      minutes: 2,
      analogy: 'A production bug is a **kitchen fire during dinner service**: stay calm, contain it, find the cause, fix it — then make sure it can\'t happen again (a test!).',
      body: `"Production" is the live system real users rely on. When it breaks, professionals follow a routine:

1. **Reproduce**: find an input that shows the bug every time.
2. **Isolate**: narrow down which function/query is wrong — print values, check each step.
3. **Fix** the root cause, not just the symptom.
4. **Prevent**: add a test that would have caught it.

The three bugs in this level are classics that bite real teams:
- a function that **secretly changes its input** (a "side effect"),
- an \`async\` callback inside \`forEach\` that nobody waits for,
- a SQL JOIN on the **wrong key** that quietly drops rows.

None of them crash — they just give wrong answers. Tests catch them.`,
      example: {
        lang: 'python',
        code: code`
          def add_tax(prices):
              for i in range(len(prices)):
                  prices[i] = prices[i] * 1.2   # side effect: changes the caller's list!
              return prices

          cart = [10, 20]
          taxed = add_tax(cart)
          print("taxed:", taxed)
          print("original cart:", cart, "<- surprise!")
        `,
      },
    },
  ],
  challenges: [
    {
      title: 'Bug 1: The disappearing discount (Python)',
      minutes: 4,
      prompt: `🐞 Customers report wrong prices, and the original price list gets corrupted after a sale runs.

\`apply_discount(prices, percent)\` should return a **new** list with each price reduced by \`percent\`%, rounded to 2 decimals — and leave the input list untouched.

\`apply_discount([10.0, 49.99], 10)\` → \`[9.0, 44.99]\``,
      starter: 'def apply_discount(prices, percent):\n    for i in range(len(prices)):\n        prices[i] = prices[i] - prices[i] * percent // 100\n    return prices\n',
      solution: 'def apply_discount(prices, percent):\n    return [round(p * (1 - percent / 100), 2) for p in prices]\n',
      solutionExplain: 'Two bugs: `//` is floor division, so 49.99 × 10 // 100 gives 4.0 instead of 4.999; and assigning to `prices[i]` changed the caller\'s list. A comprehension builds a new list with true division and rounding.',
      hints: ['Compare `49.99 * 10 // 100` with `49.99 * 10 / 100`. And: which list is being modified?', 'Return a new list: `[round(p * (1 - percent / 100), 2) for p in prices]`.'],
      tests: [
        call('apply_discount', [[10.0, 49.99], 10], [9.0, 44.99], '10% off 49.99 is 44.99 — floor division gives the wrong answer.'),
        call('apply_discount', [[100], 25], [75.0], '25% off 100 is 75.'),
        check('Input is not modified', "original = [10.0, 49.99]\napply_discount(original, 50)\nassert original == [10.0, 49.99], 'The input list was changed to ' + str(original)", 'The caller\'s list must stay the same.'),
      ],
    },
    {
      title: 'Bug 2: The empty report (JavaScript)',
      lang: 'javascript',
      minutes: 4,
      prompt: '🐞 `loadNames(ids)` should resolve to the user names, in order. It always returns `[]`. The `async` callback inside `forEach` is never awaited — fix it with `Promise.all`.',
      starter: `${MOCK_FETCH}\nasync function loadNames(ids) {\n  const names = [];\n  ids.forEach(async (id) => {\n    const res = await fakeFetch(\`/user/\${id}\`);\n    const user = await res.json();\n    names.push(user.name);\n  });\n  return names;\n}\n`,
      solution: `${MOCK_FETCH}\nasync function loadNames(ids) {\n  return Promise.all(\n    ids.map(async (id) => {\n      const res = await fakeFetch(\`/user/\${id}\`);\n      const user = await res.json();\n      return user.name;\n    }),\n  );\n}\n`,
      solutionExplain: '`forEach` ignores the Promises its callback returns, so `return names` runs before any request finishes. `map` collects the Promises and `Promise.all` waits for all of them — keeping the original order.',
      hints: ['`forEach` doesn\'t wait for async callbacks. Which array method returns what the callback returns?', 'Use `ids.map(async id => { ...; return user.name; })` and `return Promise.all(...)`.'],
      tests: [
        check('Resolves to names', "const n = await loadNames([2, 1]);\nassert(JSON.stringify(n) === JSON.stringify(['Alan', 'Ada']), 'Got ' + JSON.stringify(n));", 'loadNames([2, 1]) → ["Alan", "Ada"] in the given order.'),
        check('Empty input', "const n = await loadNames([]);\nassert(Array.isArray(n) && n.length === 0);", 'No ids → [].'),
      ],
    },
    {
      title: 'Bug 3: The missing customers (SQL)',
      lang: 'sql',
      minutes: 5,
      prompt: `🐞 The revenue report should list **every** customer (alphabetically) with their total revenue rounded to 2 decimals — **0** for customers with no orders. Right now the numbers are wrong and Alan is missing.

Useful: \`COALESCE(x, 0)\` returns \`x\`, or \`0\` if x is NULL.`,
      starter: 'SELECT c.name, SUM(o.quantity * p.price) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN products p ON o.product_id = c.id\nGROUP BY c.name\nORDER BY c.name;\n',
      sqlSetup: DB,
      solution: 'SELECT c.name, ROUND(COALESCE(SUM(o.quantity * p.price), 0), 2) AS revenue\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nLEFT JOIN products p ON o.product_id = p.id\nGROUP BY c.name\nORDER BY c.name;\n',
      solutionExplain: 'Three bugs: products were joined on `c.id` (wrong key) instead of `p.id`; INNER JOINs dropped customers without orders (use LEFT JOIN); and their SUM is NULL, so `COALESCE(..., 0)` turns it into 0. ROUND tidies the floats.',
      hints: ['Look closely at the ON condition of the products JOIN. Then: which JOIN keeps customers with no orders?', 'Use `LEFT JOIN` twice, `ON o.product_id = p.id`, and `ROUND(COALESCE(SUM(...), 0), 2)`.'],
      tests: [rows('Revenue for everyone', [['Ada', 146.96], ['Alan', 0], ['Grace', 407.5], ['Linus', 108.95], ['Margaret', 68]], 'All 5 customers, alphabetical, with correct totals (Alan: 0).', true)],
    },
  ],
  quiz: [
    {
      kind: 'bug',
      prompt: 'Why does `total` print 0?',
      code: 'let total = 0;\n[1, 2, 3].forEach(async (n) => {\n  await Promise.resolve();\n  total += n;\n});\nconsole.log(total);',
      codeLang: 'javascript',
      options: ['forEach skips numbers', 'The async callbacks finish after console.log runs; forEach doesn\'t wait', 'total should be const', 'await is not allowed'],
      answer: 1,
      explain: 'forEach fires the callbacks and moves on. Use `for...of` with await, or Promise.all with map.',
      concept: 'async-await',
    },
    {
      kind: 'concept',
      prompt: 'After fixing a production bug, what\'s the best next step?',
      options: ['Delete the logs', 'Add a test that reproduces the bug, so it can never silently return', 'Rename the function', 'Nothing'],
      answer: 1,
      explain: 'A regression test proves the fix and guards against the bug coming back.',
      concept: 'testing',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'def double_all(nums):\n    for i in range(len(nums)):\n        nums[i] *= 2\n    return nums\n\na = [1, 2]\nb = double_all(a)\nprint(a)',
      answers: ['[2, 4]'],
      explain: 'The function changed the original list — `a` and `b` are the same list object.',
      concept: 'refactoring',
    },
  ],
});
