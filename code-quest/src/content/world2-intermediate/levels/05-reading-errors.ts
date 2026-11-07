import { call, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w2.l5',
  title: 'Reading Error Messages',
  icon: '🔎',
  summary: 'Tracebacks are clues, not insults',
  lang: 'python',
  teaches: ['tracebacks'],
  requires: ['debugging', 'dicts', 'lists', 'functions', 'nested-data'],
  learn: [
    {
      title: 'Anatomy of a traceback',
      minutes: 3,
      analogy: 'A traceback is a **trail of breadcrumbs**: it shows the path Python took through your functions, and the last crumb is exactly where it fell over.',
      body: `When Python crashes it prints a **traceback**. Read it **from the bottom up**:

\`\`\`
Traceback (most recent call last):
  File "main.py", line 5, in <module>
    print(average([]))
  File "main.py", line 2, in average
    return sum(nums) / len(nums)
ZeroDivisionError: division by zero
\`\`\`

1. **Last line**: the error **type** and message — *what* went wrong.
2. **The line above it**: the exact line of code, and its line number — *where*.
3. **Higher up**: the chain of calls that led there — *how we got there*.

Here: \`average\` was called with an empty list (line 5), so it divided by 0 (line 2).`,
      example: { lang: 'python', crashes: true, code: code`
        def average(nums):
            return sum(nums) / len(nums)

        print(average([2, 4]))
        print(average([]))   # read the error panel below!
      ` },
    },
    {
      title: 'The usual suspects',
      minutes: 2,
      analogy: 'Error types are like **car dashboard lights**: each one points to a different kind of problem, so learning the common ones saves loads of time.',
      body: `| Error | Usually means |
|---|---|
| **SyntaxError** | Typo in the grammar: missing \`:\`, quote, or bracket |
| **IndentationError** | Spaces at the start of a line don't line up |
| **NameError** | Misspelled name, or used before it was created |
| **TypeError** | Wrong type: e.g. \`"a" + 1\`, or wrong number of arguments |
| **ValueError** | Right type, bad value: \`int("hi")\` |
| **IndexError** | List position doesn't exist |
| **KeyError** | Dict key doesn't exist |
| **AttributeError** | No such method: \`[1, 2].upper()\` |
| **ZeroDivisionError** | Divided by 0 |

The error message often names the culprit: \`NameError: name 'totl' is not defined\` tells you to look for \`totl\`.`,
      example: { lang: 'python', crashes: true, code: code`
        scores = {"ada": 90}
        names = ["ada", "alan"]
        for name in names:
            print(name, scores[name])   # which line fails, and why?
      ` },
    },
  ],
  practice: [
    {
      title: 'Fix the NameError',
      type: 'debug',
      minutes: 1,
      prompt: '🐞 Run it, read the traceback, and fix the bug. `total_price([2, 3])` should return `5`.',
      starter: 'def total_price(prices):\n    total = 0\n    for p in prices:\n        total += p\n    return totl\n',
      solution: 'def total_price(prices):\n    total = 0\n    for p in prices:\n        total += p\n    return total\n',
      solutionExplain: 'The message `name \'totl\' is not defined` pointed straight at the typo on the return line.',
      hints: ['The last line of the error names the unknown variable.', 'Change `totl` to `total`.'],
      tests: [call('total_price', [[2, 3]], 5, '2 + 3 = 5.'), call('total_price', [[]], 0, 'Empty list → 0.')],
    },
    {
      title: 'Fix the KeyError',
      type: 'debug',
      minutes: 2,
      prompt: '🐞 `get_city(user)` should return the user\'s city, or `"Unknown"` if they don\'t have one. It crashes for users without a city.',
      starter: 'def get_city(user):\n    return user["City"]\n',
      solution: 'def get_city(user):\n    return user.get("city", "Unknown")\n',
      solutionExplain: 'Two bugs: the key is lowercase `"city"` (keys are case-sensitive), and missing keys need `.get` with a default.',
      hints: ['Look closely at the key\'s spelling in the test data — keys are case-sensitive.', '`return user.get("city", "Unknown")`'],
      tests: [
        call('get_city', [{ name: 'Ann', city: 'Oslo' }], 'Oslo', 'The key in the data is "city" (lowercase).'),
        call('get_city', [{ name: 'Bo' }], 'Unknown', 'If there\'s no "city" key, return "Unknown".'),
      ],
    },
    {
      title: 'Fix the IndexError',
      type: 'debug',
      minutes: 2,
      prompt: '🐞 `pairs(items)` should return each item joined with the next one: `pairs(["a", "b", "c"])` → `["a-b", "b-c"]`. It crashes.',
      starter: 'def pairs(items):\n    result = []\n    for i in range(len(items)):\n        result.append(items[i] + "-" + items[i + 1])\n    return result\n',
      solution: 'def pairs(items):\n    result = []\n    for i in range(len(items) - 1):\n        result.append(items[i] + "-" + items[i + 1])\n    return result\n',
      solutionExplain: 'On the last loop, `i + 1` is past the end. Looping to `len(items) - 1` stops one early, so every `i + 1` exists.',
      hints: ['On the last iteration, what is `i + 1`? Does that position exist?', 'Use `range(len(items) - 1)`.'],
      tests: [
        call('pairs', [['a', 'b', 'c']], ['a-b', 'b-c'], 'Three items make two pairs.'),
        call('pairs', [['x']], [], 'One item makes no pairs.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'The five-bug report',
      type: 'debug',
      minutes: 6,
      prompt: `🐞 \`order_report(orders)\` should return a summary string. It has **five** bugs. Use the error messages and failing tests as your guide — fix one, re-run, repeat.

\`\`\`python
orders = [
    {"item": "pen", "qty": 3, "price": 1.5},
    {"item": "book", "qty": 1, "price": 12.0},
]
order_report(orders)  # "2 orders, 4 items, total $16.50"
\`\`\`

For an empty list it should return \`"0 orders, 0 items, total $0.00"\`. (\`:.2f\` inside an f-string shows exactly 2 decimals.)`,
      starter: 'def order_report(orders)\n    count = len(order)\n    items = 0\n    total = "0"\n    for o in orders:\n        items += o["quantity"]\n        total += o["qty"] + o["price"]\n    return f"{count} orders, {items} items, total ${total:.2f}"\n',
      solution: 'def order_report(orders):\n    count = len(orders)\n    items = 0\n    total = 0\n    for o in orders:\n        items += o["qty"]\n        total += o["qty"] * o["price"]\n    return f"{count} orders, {items} items, total ${total:.2f}"\n',
      solutionExplain: 'Bug 1: missing `:` after the def line (SyntaxError). Bug 2: `order` → `orders` (NameError). Bug 3: `total = "0"` is text, so adding a number to it fails (TypeError) — start at the number `0`. Bug 4: the key is `"qty"`, not `"quantity"` (KeyError). Bug 5: each order costs `qty * price`, not `qty + price` (a logic bug: no error, just a wrong answer).',
      hints: [
        'Work from the first error to the next: SyntaxError (punctuation), NameError (spelling), TypeError (what type is total?), KeyError (check the keys in the example data).',
        'Once it runs, compare the total: each order costs qty × price, not qty + price.',
      ],
      tests: [
        call('order_report', [[{ item: 'pen', qty: 3, price: 1.5 }, { item: 'book', qty: 1, price: 12.0 }]], '2 orders, 4 items, total $16.50', '3 pens at 1.50 = 4.50, plus a 12.00 book = 16.50.'),
        call('order_report', [[]], '0 orders, 0 items, total $0.00', 'An empty list should not crash.'),
        call('order_report', [[{ item: 'cup', qty: 2, price: 2.25 }]], '1 orders, 2 items, total $4.50', '2 × 2.25 = 4.50.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'concept',
      prompt: 'Where should you start reading a Python traceback?',
      options: ['The first line', 'The last line', 'The middle', 'It doesn\'t matter'],
      answer: 1,
      explain: 'The last line names the error and message; the line above shows where it happened.',
    },
    {
      kind: 'bug',
      prompt: 'Which error will this raise?',
      code: 'age = "25"\nprint(age + 1)',
      options: ['NameError', 'TypeError', 'ValueError', 'SyntaxError'],
      answer: 1,
      explain: 'You can\'t add a str and an int — that\'s a TypeError.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'Which error type does this raise? (Type just the name.)',
      code: 'nums = [1, 2, 3]\nprint(nums[3])',
      answers: ['IndexError'],
      explain: 'Position 3 doesn\'t exist in a 3-item list (positions 0–2).',
    },
    {
      kind: 'bug',
      prompt: 'Which error will this raise?',
      code: 'print(int("12.5"))',
      options: ['TypeError', 'ValueError', 'KeyError', 'No error'],
      answer: 1,
      explain: 'It\'s a string (right type for int()), but "12.5" isn\'t a whole number — a bad value.',
    },
  ],
});
