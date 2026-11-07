import { check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w2.l9',
  title: 'Classes & Objects',
  icon: '🏭',
  summary: 'Bundle data and behavior together (intro to OOP)',
  lang: 'python',
  teaches: ['classes'],
  requires: ['functions', 'return', 'parameters', 'try-except', 'lists', 'fstrings'],
  learn: [
    {
      title: 'Blueprints and objects',
      minutes: 3,
      analogy: 'A **class** is a **cookie cutter**; each **object** is a cookie made with it. Same shape, but each cookie can have its own sprinkles.',
      body: `So far data (variables) and behavior (functions) have lived separately. A **class** bundles them. This style is called **object-oriented programming (OOP)**.

\`\`\`python
class Dog:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} says woof!"

rex = Dog("Rex")      # create an object (an "instance")
print(rex.speak())
\`\`\`

- \`__init__\` is the **constructor**: it runs when you create an object, setting up its data.
- \`self\` is the object itself. \`self.name\` is an **attribute** — a variable that belongs to this object.
- \`speak\` is a **method** — a function that belongs to the class. Every method takes \`self\` first.`,
      example: { lang: 'python', code: code`
        class Dog:
            def __init__(self, name, age):
                self.name = name
                self.age = age

            def speak(self):
                return f"{self.name} says woof!"

        rex = Dog("Rex", 3)
        fido = Dog("Fido", 7)
        print(rex.speak(), fido.speak())
        print(fido.age)
        fido.age += 1   # objects keep their own data
        print(fido.age, rex.age)
      ` },
    },
    {
      title: 'Methods that change state',
      minutes: 3,
      analogy: 'An object is like a **game character**: it remembers its own health and coins, and actions (methods) like `heal()` change them.',
      body: `An object's attributes are its **state**. Methods can read and change that state through \`self\`:

\`\`\`python
class Counter:
    def __init__(self):
        self.count = 0

    def click(self):
        self.count += 1
\`\`\`

Each object has its **own** state: clicking one counter doesn't change another.

Methods can also **protect** the state, refusing bad changes by raising an error:

\`\`\`python
def withdraw(self, amount):
    if amount > self.balance:
        raise ValueError("Insufficient funds")
    self.balance -= amount
\`\`\`

Why bother? A class keeps related data and rules in one place, so you can't easily put the object into a broken state by accident.`,
      example: { lang: 'python', code: code`
        class Counter:
            def __init__(self):
                self.count = 0

            def click(self):
                self.count += 1
                return self.count

        a = Counter()
        b = Counter()
        a.click()
        a.click()
        b.click()
        print(a.count, b.count)
      ` },
    },
  ],
  practice: [
    {
      title: 'Cat class',
      minutes: 2,
      prompt: 'Make a class `Cat` whose constructor takes a `name`. It needs a method `speak()` that returns `"NAME says meow!"`.',
      starter: 'class Cat:\n    pass\n',
      solution: 'class Cat:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return f"{self.name} says meow!"\n',
      solutionExplain: '`__init__` stores the name on `self`; `speak` reads it back through `self.name`.',
      hints: ['You need `def __init__(self, name):` that sets `self.name`, and `def speak(self):`.', '`return f"{self.name} says meow!"` — don\'t forget `self` as the first parameter.'],
      tests: [
        check('Cat("Tom").speak()', "assert Cat('Tom').speak() == 'Tom says meow!', 'Got: ' + str(Cat('Tom').speak())", 'Cat("Tom").speak() should return "Tom says meow!".'),
        check('Each cat has its own name', "a = Cat('A'); b = Cat('B')\nassert a.name == 'A' and b.name == 'B'", 'Store the name on self so each object keeps its own.'),
      ],
    },
    {
      title: 'Piggy bank',
      minutes: 3,
      prompt: 'Make a class `PiggyBank` that starts with `self.coins = 0`. Add `add(amount)` which adds to the coins, and `total()` which returns the coins.',
      starter: 'class PiggyBank:\n    def __init__(self):\n        pass\n',
      solution: 'class PiggyBank:\n    def __init__(self):\n        self.coins = 0\n\n    def add(self, amount):\n        self.coins += amount\n\n    def total(self):\n        return self.coins\n',
      solutionExplain: 'The constructor sets the starting state; `add` changes it; `total` reports it.',
      hints: ['Set `self.coins = 0` in `__init__`.', '`def add(self, amount): self.coins += amount` and `def total(self): return self.coins`.'],
      tests: [
        check('Starts at 0', "assert PiggyBank().total() == 0", 'A new piggy bank has 0 coins.'),
        check('Adds up', "p = PiggyBank(); p.add(5); p.add(3)\nassert p.total() == 8, 'Got ' + str(p.total())", 'Adding 5 then 3 should total 8.'),
        check('Separate banks', "a = PiggyBank(); b = PiggyBank(); a.add(10)\nassert b.total() == 0", 'Each piggy bank has its own coins.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Bank account with rules',
      minutes: 7,
      prompt: `Build a \`BankAccount\` class:

- \`BankAccount(owner, balance=0)\` — store both.
- \`deposit(amount)\` — amount must be **positive**, otherwise raise \`ValueError("Deposit must be positive")\`. Adds to the balance.
- \`withdraw(amount)\` — amount must be positive (\`ValueError("Withdrawal must be positive")\`) and not more than the balance (\`ValueError("Insufficient funds")\`).
- Keep a \`history\` list. Each successful deposit appends \`"deposit 50"\`, each withdrawal \`"withdraw 20"\`.
- \`statement()\` returns \`"OWNER: $BALANCE"\`, e.g. \`"Ada: $30"\`.`,
      starter: 'class BankAccount:\n    def __init__(self, owner, balance=0):\n        pass\n',
      solution: 'class BankAccount:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n        self.history = []\n\n    def deposit(self, amount):\n        if amount <= 0:\n            raise ValueError("Deposit must be positive")\n        self.balance += amount\n        self.history.append(f"deposit {amount}")\n\n    def withdraw(self, amount):\n        if amount <= 0:\n            raise ValueError("Withdrawal must be positive")\n        if amount > self.balance:\n            raise ValueError("Insufficient funds")\n        self.balance -= amount\n        self.history.append(f"withdraw {amount}")\n\n    def statement(self):\n        return f"{self.owner}: ${self.balance}"\n',
      solutionExplain: 'The constructor sets up all state, including an empty history list. Each method checks its rules first and raises before changing anything — so a failed withdrawal never leaves the balance half-updated. Successful actions are recorded in `self.history`.',
      hints: [
        'In `__init__` set `self.owner`, `self.balance` and `self.history = []`. Each method checks rules with `if ...: raise ValueError("...")` BEFORE changing the balance.',
        'After a successful change: `self.history.append(f"deposit {amount}")`. `statement` returns `f"{self.owner}: ${self.balance}"`.',
      ],
      tests: [
        check('Deposit and withdraw', "a = BankAccount('Ada')\na.deposit(50)\na.withdraw(20)\nassert a.balance == 30, 'balance is ' + str(a.balance)", 'Deposit 50, withdraw 20 → balance 30.'),
        check('Starting balance', "assert BankAccount('Bo', 100).balance == 100", 'BankAccount("Bo", 100) starts with 100.'),
        check('History', "a = BankAccount('Ada'); a.deposit(50); a.withdraw(20)\nassert a.history == ['deposit 50', 'withdraw 20'], 'history is ' + str(a.history)", 'Record each successful action in order.'),
        check('Statement', "a = BankAccount('Ada', 30)\nassert a.statement() == 'Ada: $30', a.statement()", 'statement() → "Ada: $30".'),
        check('Insufficient funds', "a = BankAccount('Ada', 10)\ntry:\n    a.withdraw(50)\n    assert False, 'No error raised'\nexcept ValueError as e:\n    assert str(e) == 'Insufficient funds', str(e)\nassert a.balance == 10 and a.history == [], 'A failed withdrawal must not change anything'", 'Withdrawing more than the balance raises ValueError("Insufficient funds") and changes nothing.'),
        check('Non-positive amounts', "a = BankAccount('Ada', 10)\nfor bad, method, msg in [(0, a.deposit, 'Deposit must be positive'), (-5, a.withdraw, 'Withdrawal must be positive')]:\n    try:\n        method(bad)\n        assert False, 'No error raised for ' + str(bad)\n    except ValueError as e:\n        assert str(e) == msg, str(e)", 'Zero or negative amounts must raise ValueError with the right message.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'class Box:\n    def __init__(self, size):\n        self.size = size\n    def grow(self):\n        self.size *= 2\n\na = Box(2)\nb = Box(5)\na.grow()\na.grow()\nprint(a.size, b.size)',
      answers: ['8 5'],
      explain: 'a grows 2 → 4 → 8. b is a separate object, still 5.',
    },
    {
      kind: 'bug',
      prompt: 'Calling `p.greet()` raises `TypeError: greet() takes 0 positional arguments but 1 was given`. Why?',
      code: 'class Person:\n    def __init__(self, name):\n        self.name = name\n    def greet():\n        return "Hi " + self.name',
      options: ['greet needs `self` as its first parameter', '__init__ is spelled wrong', 'self.name should be name', 'Classes can\'t return strings'],
      answer: 0,
      explain: 'Python passes the object automatically as the first argument, so every method needs `self`.',
    },
    {
      kind: 'concept',
      prompt: 'What is `__init__` for?',
      options: ['Deleting objects', 'Setting up a new object\'s starting data', 'Printing the object', 'Importing the class'],
      answer: 1,
      explain: '`__init__` (the constructor) runs automatically when you create an object.',
    },
  ],
});
