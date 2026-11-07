import { call, check, code, defineLevel } from '../../dsl';

const MESSY = code`
  def p(o):
      t = 0
      s = ""
      for x in o:
          if x["type"] == "book":
              a = x["price"] * x["qty"]
              a = a + a * 0.0
              t = t + a
              s = s + x["name"] + ": $" + str(round(a, 2)) + "\n"
          if x["type"] == "food":
              a = x["price"] * x["qty"]
              a = a + a * 0.05
              t = t + a
              s = s + x["name"] + ": $" + str(round(a, 2)) + "\n"
          if x["type"] == "gadget":
              a = x["price"] * x["qty"]
              a = a + a * 0.2
              t = t + a
              s = s + x["name"] + ": $" + str(round(a, 2)) + "\n"
      if t > 100:
          t = t - t * 0.1
          s = s + "Discount: 10%\n"
      s = s + "Total: $" + str(round(t, 2))
      return s
`;

const CLEAN = code`
  TAX_RATES = {"book": 0.0, "food": 0.05, "gadget": 0.2}
  DISCOUNT_THRESHOLD = 100
  DISCOUNT_RATE = 0.1


  def line_total(item):
      subtotal = item["price"] * item["qty"]
      return subtotal * (1 + TAX_RATES[item["type"]])


  def format_line(name, amount):
      return f"{name}: \${round(amount, 2)}"


  def make_invoice(items):
      lines = []
      total = 0
      for item in items:
          amount = line_total(item)
          total += amount
          lines.append(format_line(item["name"], amount))
      if total > DISCOUNT_THRESHOLD:
          total -= total * DISCOUNT_RATE
          lines.append("Discount: 10%")
      lines.append(format_line("Total", total))
      return "\n".join(lines)
`;

const CART = [
  { name: 'Novel', type: 'book', price: 12.5, qty: 2 },
  { name: 'Coffee', type: 'food', price: 8.0, qty: 3 },
  { name: 'Headphones', type: 'gadget', price: 60.0, qty: 1 },
];
const SMALL = [{ name: 'Apple', type: 'food', price: 0.5, qty: 4 }];

export default defineLevel({
  id: 'w3.l15',
  title: 'Refactoring',
  icon: '🧹',
  summary: 'Clean up messy code without changing what it does',
  lang: 'python',
  teaches: ['refactoring'],
  requires: ['testing', 'functions', 'dicts', 'fstrings', 'parameters'],
  learn: [
    {
      title: 'Same behavior, better code',
      minutes: 3,
      analogy: '**Tidying a kitchen**: the meals you cook don\'t change, but now you can find the spoons — and the next cook won\'t curse you.',
      body: `**Refactoring** means improving code's structure **without changing its behavior**. Tests are your safety net: run them before and after every small change.

Core moves:

- **Rename**: \`t\` → \`total\`, \`p\` → \`make_invoice\`. Names should say *what*, not *how*.
- **Extract function**: give a chunk of code a name, e.g. \`line_total(item)\`.
- **DRY** ("Don't Repeat Yourself"): if you've copy-pasted code, pull it into one function or a data table.
- **Replace magic numbers** with named constants: \`0.2\` → \`TAX_RATES["gadget"]\`.
- **Guard clauses**: handle special cases early with \`return\`, instead of deep nesting.

Messy code works today; clean code keeps working when you change it tomorrow.`,
      example: {
        lang: 'python',
        code: code`
          # Before: nested and unclear
          def ship(o):
              if o["paid"]:
                  if o["items"]:
                      return "shipping"
                  else:
                      return "empty"
              else:
                  return "unpaid"

          # After: guard clauses, flat and readable
          def shipping_status(order):
              if not order["paid"]:
                  return "unpaid"
              if not order["items"]:
                  return "empty"
              return "shipping"

          o = {"paid": True, "items": ["book"]}
          print(ship(o), shipping_status(o))
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Rename and guard',
      minutes: 3,
      prompt: 'Refactor `f` into `average_of_positives(numbers)`: same behavior (average of the numbers above 0, or `0` if there are none), but with clear names and a guard clause. The old name `f` should be gone.',
      starter: 'def f(l):\n    x = []\n    for i in l:\n        if i > 0:\n            x.append(i)\n    if len(x) > 0:\n        return sum(x) / len(x)\n    else:\n        return 0\n',
      solution: 'def average_of_positives(numbers):\n    positives = [n for n in numbers if n > 0]\n    if not positives:\n        return 0\n    return sum(positives) / len(positives)\n',
      solutionExplain: 'Descriptive names, a comprehension instead of the manual loop, and a guard clause for the empty case.',
      hints: ['Rename the function and variables; a comprehension can replace the loop.', '`if not positives: return 0` as a guard, then the average.'],
      tests: [
        call('average_of_positives', [[4, -2, 8]], 6.0, 'Average of 4 and 8.'),
        call('average_of_positives', [[-1, 0]], 0, 'No positives → 0.'),
        check('Old name removed', "assert 'def f(' not in CODE", 'Rename `f` to `average_of_positives`.'),
      ],
    },

    {
      title: 'Flatten with guard clauses',
      minutes: 3,
      prompt: `Rewrite \`shipping_cost(order)\` with **guard clauses** so no line is indented more than two levels (8 spaces). Behavior must stay the same:

- not paid → \`None\`
- weight over 30 → \`None\` (too heavy)
- express → \`15\`; otherwise \`5\`, or \`0\` if the total is 50 or more`,
      starter: 'def shipping_cost(order):\n    if order["paid"]:\n        if order["weight"] <= 30:\n            if order["express"]:\n                return 15\n            else:\n                if order["total"] >= 50:\n                    return 0\n                else:\n                    return 5\n        else:\n            return None\n    else:\n        return None\n',
      solution: 'def shipping_cost(order):\n    if not order["paid"]:\n        return None\n    if order["weight"] > 30:\n        return None\n    if order["express"]:\n        return 15\n    if order["total"] >= 50:\n        return 0\n    return 5\n',
      solutionExplain: 'Each guard handles one special case and returns early, so the "normal path" reads straight down with no nesting.',
      hints: ['Flip each condition and return early: `if not order["paid"]: return None`.', 'After the guards, the remaining cases are simple ifs at the same level.'],
      tests: [
        check('Same behavior', "base = {'paid': True, 'weight': 2, 'express': False, 'total': 20}\ncases = [({}, 5), ({'total': 50}, 0), ({'express': True}, 15), ({'weight': 31}, None), ({'paid': False}, None)]\nfor change, expected in cases:\n    o = dict(base); o.update(change)\n    assert shipping_cost(o) == expected, str(change) + ' gave ' + str(shipping_cost(o))", 'Every rule must behave exactly as before.'),
        check('Flat code', "deep = [l for l in CODE.splitlines() if l.startswith(' ' * 9) and l.strip()]\nassert not deep, 'Too deeply nested: ' + deep[0].strip()", 'No line should be indented more than 8 spaces.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Clean up the invoice',
      minutes: 8,
      prompt: `This invoice code works but is a mess: one-letter names, copy-pasted blocks, magic numbers. Refactor it into **\`make_invoice(items)\`** that returns **exactly the same text**.

Requirements (checked by the tests):
- Function \`make_invoice(items)\` gives identical output to the old \`p(o)\` for any cart.
- At least **two helper functions** besides \`make_invoice\`.
- Tax rates live in **one** place (e.g. a \`TAX_RATES\` dict) — the numbers \`0.05\` and \`0.2\` appear only once each.
- No copy-pasted blocks: the expression \`["price"] * \` appears only once.

The old function is kept below as \`p\` so you can compare outputs — delete it when you're done.`,
      starter: `# Refactor this into make_invoice(items) with helpers.\n${MESSY}`,
      solution: CLEAN,
      solutionExplain: 'A tax table replaces three copy-pasted branches, `line_total` and `format_line` each do one job, and named constants explain the discount rule. Same output, but adding a new product type is now a one-line change.',
      hints: [
        'Put the tax rates in a dict keyed by type. Then one helper computes an item\'s total, and another formats a line like "Name: $12.34".',
        'Build a list of lines and `"\\n".join(lines)` at the end. Keep the discount rule exactly: over 100 → minus 10% and a "Discount: 10%" line before the total.',
      ],
      tests: [
        check('Same output for a big cart', `${MESSY}\nitems = ${JSON.stringify(CART)}\nassert make_invoice(items) == p(items), 'Output differs:\\n' + make_invoice(items)`, 'make_invoice must return exactly what the old code returned (including the discount line).'),
        check('Same output for a small cart', `${MESSY}\nitems = ${JSON.stringify(SMALL)}\nassert make_invoice(items) == p(items), 'Output differs:\\n' + make_invoice(items)`, 'Small cart, no discount: output must still match.'),
        check('Same output for an empty cart', `${MESSY}\nassert make_invoice([]) == p([]), make_invoice([])`, 'An empty cart should give the same "Total: $0" line.'),
        check('Has helper functions', "assert CODE.count('def ') >= 3, 'Found only ' + str(CODE.count('def ')) + ' functions'\nassert 'def make_invoice(' in CODE", 'Extract at least two helpers besides make_invoice.'),
        check('Tax rates in one place', "assert CODE.count('0.05') == 1 and CODE.count('0.2') == 1, 'Tax numbers repeated'", 'Each tax rate number should appear exactly once.'),
        check('No copy-paste', "assert CODE.count('[\"price\"] * ') + CODE.count(\"['price'] * \") == 1, 'Price calculation repeated'", 'The price × qty calculation should appear only once.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'def label(n):\n    if n < 0:\n        return "negative"\n    if n == 0:\n        return "zero"\n    return "positive"\n\nprint(label(0), label(-3))',
      answers: ['zero negative'],
      explain: 'Each guard clause returns early: 0 hits the second guard, -3 the first.',
    },
    {
      kind: 'concept',
      prompt: 'What must stay the same during a refactor?',
      options: ['The variable names', 'The behavior (inputs → outputs)', 'The number of lines', 'The file name'],
      answer: 1,
      explain: 'Refactoring changes structure, never behavior — tests prove it.',
    },
    {
      kind: 'bug',
      prompt: 'What\'s the main code smell here?',
      code: 'if level == 1:\n    damage = power * 1.0\nif level == 2:\n    damage = power * 1.5\nif level == 3:\n    damage = power * 2.0',
      options: ['Too few comments', 'Repetition with magic numbers — use a dict like MULTIPLIERS[level]', 'Using if', 'Variable names are too long'],
      answer: 1,
      explain: '`damage = power * MULTIPLIERS[level]` replaces all three branches.',
    },
    {
      kind: 'concept',
      prompt: 'Why run tests before AND after each refactoring step?',
      options: ['To make the code faster', 'To prove behavior didn\'t change, catching mistakes immediately', 'Tests are only for new features', 'It\'s required by Python'],
      answer: 1,
      explain: 'Small steps + tests = you always know which change broke something.',
    },
  ],
});
