import { check, code, defineLevel } from '../../dsl';

const s1 = code`
  class Transaction:
      def __init__(self, description, amount, category):
          self.description = description
          self.amount = amount
          self.category = category

      def is_expense(self):
          return self.amount < 0

      def describe(self):
          return f"{self.description} ({self.category}): {self.amount}"
`;

const s2Budget = code`
  class Budget:
      def __init__(self, owner):
          self.owner = owner
          self.transactions = []

      def add(self, transaction):
          self.transactions.append(transaction)

      def balance(self):
          return round(sum([t.amount for t in self.transactions]), 2)
`;
const s2 = `${s1}\n\n${s2Budget}`;

const s3Methods = code`
      def totals_by_category(self):
          totals = {}
          for t in self.transactions:
              totals[t.category] = round(totals.get(t.category, 0) + t.amount, 2)
          return totals

      def biggest_expense_category(self):
          totals = self.totals_by_category()
          worst = None
          for category, total in totals.items():
              if total < 0 and (worst is None or total < totals[worst]):
                  worst = category
          return worst
`.replace(/^/gm, '    ').replace(/^    $/gm, '');
const s3 = `${s2}\n${s3Methods}`;

const s4 = code`
  class Transaction:
      def __init__(self, description, amount, category):
          if description.strip() == "":
              raise ValueError("Description required")
          if amount == 0:
              raise ValueError("Amount cannot be zero")
          self.description = description
          self.amount = amount
          self.category = category

      def is_expense(self):
          return self.amount < 0

      def describe(self):
          return f"{self.description} ({self.category}): {self.amount}"


  class Budget:
      def __init__(self, owner):
          self.owner = owner
          self.transactions = []

      def add(self, transaction):
          self.transactions.append(transaction)

      def balance(self):
          return round(sum([t.amount for t in self.transactions]), 2)

      def totals_by_category(self):
          totals = {}
          for t in self.transactions:
              totals[t.category] = round(totals.get(t.category, 0) + t.amount, 2)
          return totals

      def biggest_expense_category(self):
          totals = self.totals_by_category()
          worst = None
          for category, total in totals.items():
              if total < 0 and (worst is None or total < totals[worst]):
                  worst = category
          return worst

      def add_from_text(self, line):
          try:
              description, amount, category = line.split(",")
              t = Transaction(description.strip(), float(amount), category.strip())
          except ValueError:
              return False
          self.add(t)
          return True

      def report(self):
          lines = [f"Budget for {self.owner}", f"Balance: {self.balance()}"]
          for category, total in sorted(self.totals_by_category().items()):
              lines.append(f"  {category}: {total}")
          return "\n".join(lines)
`;

const SAMPLE = "b = Budget('Ada')\nb.add(Transaction('Salary', 1200, 'job'))\nb.add(Transaction('Rent', -800, 'home'))\nb.add(Transaction('Coffee', -3.5, 'food'))\nb.add(Transaction('Lunch', -12.25, 'food'))\n";

export default defineLevel({
  id: 'w2.bossA',
  title: 'Budget Tracker (Python)',
  kind: 'boss',
  icon: '💰',
  summary: 'BOSS part A: a budget app built from classes',
  lang: 'python',
  teaches: [],
  requires: ['classes', 'dicts', 'try-except', 'string-manipulation', 'comprehensions', 'parameters'],
  learn: [
    {
      title: 'Boss briefing: the budget tracker',
      minutes: 3,
      analogy: 'Classes let you model the real world: a **transaction** is like one receipt, a **budget** is the shoebox that holds all your receipts and can add them up.',
      body: `Part A: build the "brain" of a budget app in Python.

1. A \`Transaction\` class — one income (positive amount) or expense (negative amount).
2. A \`Budget\` class that holds many transactions and knows its balance.
3. Totals per category, using a dict.
4. Safety: validation with exceptions, reading transactions from text, and a printed report.

This is **composition**: a Budget *has* Transactions. Each class does one job and the classes work together.

Part B (next node) builds a web page for it in JavaScript.`,
      example: {
        lang: 'python',
        code: code`
          class Receipt:
              def __init__(self, shop, total):
                  self.shop = shop
                  self.total = total

          box = [Receipt("Cafe", 4.5), Receipt("Books", 20)]
          print(sum([r.total for r in box]))
        `,
      },
    },
  ],
  challenges: [
    {
      title: 'Step 1: Transaction class',
      minutes: 4,
      prompt: `Create a \`Transaction\` class:

- \`Transaction(description, amount, category)\` stores all three.
- \`is_expense()\` returns \`True\` when the amount is negative.
- \`describe()\` returns \`"DESCRIPTION (CATEGORY): AMOUNT"\`, e.g. \`"Coffee (food): -3.5"\`.`,
      starter: '# Step 1: the Transaction class\n',
      solution: s1,
      solutionExplain: 'The constructor stores the data on `self`; the two methods read it back. A negative amount means money went out.',
      hints: ['`def __init__(self, description, amount, category):` and three `self.x = x` lines.', '`is_expense` returns `self.amount < 0`; `describe` returns an f-string.'],
      tests: [
        check('Stores its data', "t = Transaction('Coffee', -3.5, 'food')\nassert (t.description, t.amount, t.category) == ('Coffee', -3.5, 'food')", 'Store description, amount and category on self.'),
        check('is_expense', "assert Transaction('Coffee', -3.5, 'food').is_expense() is True\nassert Transaction('Salary', 1200, 'job').is_expense() is False", 'Negative → True, positive → False.'),
        check('describe', "d = Transaction('Coffee', -3.5, 'food').describe()\nassert d == 'Coffee (food): -3.5', 'Got: ' + d", 'Format: "Coffee (food): -3.5".'),
      ],
    },
    {
      title: 'Step 2: Budget holds transactions',
      minutes: 4,
      prompt: `Add a \`Budget\` class:

- \`Budget(owner)\` stores the owner and an empty \`transactions\` list.
- \`add(transaction)\` appends a Transaction.
- \`balance()\` returns the sum of all amounts, rounded to 2 decimals.`,
      starter: `${s1}\n\n# Step 2: the Budget class\n`,
      solution: s2,
      solutionExplain: 'The Budget *has a* list of Transaction objects. `balance` uses a comprehension to pull out each amount, then `sum`.',
      hints: ['`self.transactions = []` in `__init__`; `add` uses `.append`.', '`return round(sum([t.amount for t in self.transactions]), 2)`'],
      tests: [
        check('Starts empty', "b = Budget('Ada')\nassert b.owner == 'Ada' and b.transactions == [] and b.balance() == 0", 'A new budget has no transactions and a balance of 0.'),
        check('Balance', SAMPLE + "assert b.balance() == 384.25, 'balance is ' + str(b.balance())", '1200 − 800 − 3.5 − 12.25 = 384.25.'),
        check('Separate budgets', "a = Budget('A'); c = Budget('C'); a.add(Transaction('x', 5, 'y'))\nassert c.transactions == [], 'Budgets share a list!'", 'Each budget must have its own list (create it in __init__).'),
      ],
    },
    {
      title: 'Step 3: Totals by category',
      minutes: 5,
      prompt: `Add two methods to \`Budget\`:

- \`totals_by_category()\` → dict from category to the sum of its amounts (rounded to 2 decimals).
  With the sample data: \`{"job": 1200, "home": -800, "food": -15.75}\`
- \`biggest_expense_category()\` → the category with the most negative total, or \`None\` if there are no expenses.`,
      starter: `${s2}\n    # Step 3: totals_by_category and biggest_expense_category\n`,
      solution: s3,
      solutionExplain: 'The counting pattern again — but summing amounts instead of counting. The second method reuses the first and looks for the smallest (most negative) total.',
      hints: [
        'Counting pattern with amounts: `totals[t.category] = totals.get(t.category, 0) + t.amount`.',
        'For the biggest expense: loop over `.items()`, consider only `total < 0`, keep the category with the smallest total.',
      ],
      tests: [
        check('totals_by_category', SAMPLE + "assert b.totals_by_category() == {'job': 1200, 'home': -800, 'food': -15.75}, str(b.totals_by_category())", 'Sum amounts per category.'),
        check('biggest_expense_category', SAMPLE + "assert b.biggest_expense_category() == 'home'", 'home (−800) is the biggest expense.'),
        check('No expenses → None', "b = Budget('Rich'); b.add(Transaction('Gift', 50, 'misc'))\nassert b.biggest_expense_category() is None", 'With only income, return None.'),
      ],
    },
    {
      title: 'Step 4: Validation and report',
      minutes: 7,
      prompt: `Make it robust:

1. \`Transaction\` raises \`ValueError("Description required")\` for a blank description and \`ValueError("Amount cannot be zero")\` for an amount of 0.
2. \`Budget.add_from_text(line)\` parses \`"Coffee, -3.5, food"\` (comma-separated, spaces trimmed), adds the transaction and returns \`True\`. For **any** bad line (wrong number of parts, non-number amount, invalid transaction) it returns \`False\` and adds nothing.
3. \`Budget.report()\` returns:

\`\`\`
Budget for Ada
Balance: 384.25
  food: -15.75
  home: -800.0
  job: 1200.0
\`\`\`

(categories sorted alphabetically, each line indented by two spaces; amounts read from text are floats, so they show \`.0\`).

Tip: \`a, b, c = line.split(",")\` raises ValueError if there aren't exactly 3 parts — so one \`except ValueError\` can catch every kind of bad line.`,
      starter: `${s3}\n# Step 4: validation in Transaction, add_from_text and report in Budget\n`,
      solution: s4,
      solutionExplain: 'Validation lives in the Transaction constructor, so an invalid transaction can never exist. `add_from_text` wraps splitting, conversion AND construction in one try — all three raise ValueError on bad input. `report` builds a list of lines and joins them.',
      hints: [
        'Add the two `if ...: raise ValueError(...)` checks at the top of `Transaction.__init__`. In `add_from_text`, put the split, `float()` and `Transaction(...)` inside one `try`.',
        'report: start `lines = [f"Budget for {self.owner}", f"Balance: {self.balance()}"]`, append `f"  {category}: {total}"` for each sorted item, `return "\\n".join(lines)`.',
      ],
      tests: [
        check('Validation errors', "for args, msg in [(('', 5, 'x'), 'Description required'), (('  ', 5, 'x'), 'Description required'), (('Tea', 0, 'food'), 'Amount cannot be zero')]:\n    try:\n        Transaction(*args)\n        assert False, 'No error for ' + str(args)\n    except ValueError as e:\n        assert str(e) == msg, str(e)", 'Blank descriptions and zero amounts must raise ValueError with the given messages.'),
        check('add_from_text good lines', "b = Budget('Ada')\nassert b.add_from_text('Coffee, -3.5, food') is True\nt = b.transactions[0]\nassert (t.description, t.amount, t.category) == ('Coffee', -3.5, 'food'), t.describe()", 'Trim each part and convert the amount to a float.'),
        check('add_from_text bad lines', "b = Budget('Ada')\nfor bad in ['nonsense', 'Gift,abc,misc', ',-5,food', 'a,1,b,c', 'Tea,0,food']:\n    assert b.add_from_text(bad) is False, 'Should reject ' + repr(bad)\nassert b.transactions == [], 'Bad lines must not be added'", 'Every kind of bad line returns False and adds nothing.'),
        check('report', "b = Budget('Ada')\nfor line in ['Salary, 1200, job', 'Rent,-800,home', 'Coffee,-3.5,food', 'Lunch,-12.25,food', 'oops']:\n    b.add_from_text(line)\nexpected = 'Budget for Ada\\nBalance: 384.25\\n  food: -15.75\\n  home: -800.0\\n  job: 1200.0'\nassert b.report() == expected, 'Got:\\n' + b.report()", 'Header, balance, then categories alphabetically, each indented two spaces.'),
      ],
    },
  ],
  quiz: [],
});
