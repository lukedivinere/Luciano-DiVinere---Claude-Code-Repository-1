import { check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w2.l10',
  title: 'Debug: Broken Inventory',
  kind: 'debug',
  icon: '🐞',
  summary: 'Debug Mode: fix a buggy class and its data',
  lang: 'python',
  teaches: [],
  requires: ['classes', 'dicts', 'try-except', 'comprehensions', 'tracebacks'],
  learn: [
    {
      title: 'Debugging objects',
      minutes: 2,
      analogy: 'Debugging a class is like checking a **vending machine**: test one button at a time, and look inside (print the state) to see what it really holds.',
      body: `Bugs in classes often come from:

- Forgetting \`self.\` — writing \`count = 0\` makes a local variable that disappears, instead of \`self.count = 0\`.
- Forgetting \`self\` as the first parameter of a method.
- **Changing state before checking the rules**, leaving the object half-updated when an error is raised.
- Returning the wrong thing, or nothing at all (\`None\`).

A great debugging trick: print an object's state with \`vars(obj)\`, which shows all its attributes as a dict.

Fix one bug, re-run the tests, read the next failure. Repeat.`,
      example: { lang: 'python', code: code`
        class Lamp:
            def __init__(self):
                on = False          # bug: forgot self.

        lamp = Lamp()
        print(vars(lamp))           # {} — nothing was stored!
      ` },
    },
  ],
  challenges: [
    {
      title: 'Bug 1: The forgetful inventory',
      minutes: 3,
      prompt: '🐞 `Inventory` should track item counts in a dict. `add("apple", 3)` then `add("apple", 2)` should give `count("apple") == 5`, and `count` of a missing item is `0`. Fix the bugs.',
      starter: 'class Inventory:\n    def __init__(self):\n        items = {}\n\n    def add(self, name, qty):\n        self.items[name] = qty\n\n    def count(self, name):\n        return self.items[name]\n',
      solution: 'class Inventory:\n    def __init__(self):\n        self.items = {}\n\n    def add(self, name, qty):\n        self.items[name] = self.items.get(name, 0) + qty\n\n    def count(self, name):\n        return self.items.get(name, 0)\n',
      solutionExplain: 'Three bugs: `items = {}` needed `self.`; `add` replaced the count instead of adding to it; `count` crashed on missing items instead of using `.get(name, 0)`.',
      hints: ['Start with the AttributeError: where should `items` be stored so other methods can see it?', '`add` should use the counting pattern: `self.items.get(name, 0) + qty`. `count` should use `.get(name, 0)`.'],
      tests: [
        check('Adds up', "inv = Inventory(); inv.add('apple', 3); inv.add('apple', 2)\nassert inv.count('apple') == 5, 'got ' + str(inv.count('apple'))", 'Adding the same item twice should add the quantities.'),
        check('Missing item is 0', "assert Inventory().count('pear') == 0", 'count of an item never added is 0.'),
      ],
    },
    {
      title: 'Bug 2: Half-finished removal',
      minutes: 3,
      prompt: '🐞 `remove(name, qty)` should raise `ValueError("Not enough NAME")` when there isn\'t enough stock — **without** changing anything. Right now a failed removal still changes the count. Also `low_stock(limit)` should return the names with count **below** `limit`, sorted alphabetically.',
      starter: 'class Inventory:\n    def __init__(self):\n        self.items = {}\n\n    def add(self, name, qty):\n        self.items[name] = self.items.get(name, 0) + qty\n\n    def remove(self, name, qty):\n        self.items[name] = self.items.get(name, 0) - qty\n        if self.items[name] < 0:\n            raise ValueError(f"Not enough {name}")\n\n    def low_stock(self, limit):\n        return [n for n in self.items if self.items[n] <= limit]\n',
      solution: 'class Inventory:\n    def __init__(self):\n        self.items = {}\n\n    def add(self, name, qty):\n        self.items[name] = self.items.get(name, 0) + qty\n\n    def remove(self, name, qty):\n        if self.items.get(name, 0) < qty:\n            raise ValueError(f"Not enough {name}")\n        self.items[name] -= qty\n\n    def low_stock(self, limit):\n        return sorted([n for n in self.items if self.items[n] < limit])\n',
      solutionExplain: 'Check the rule BEFORE changing state, so a failed removal leaves the object untouched. `low_stock` used `<=` instead of `<` and forgot to sort — `sorted(list)` returns a new sorted list.',
      hints: ['Move the check above the subtraction, and compare the CURRENT count with qty.', 'In `low_stock`, "below" means `<`, and wrap the comprehension in `sorted(...)`.'],
      tests: [
        check('Removes', "inv = Inventory(); inv.add('pen', 5); inv.remove('pen', 2)\nassert inv.items['pen'] == 3", '5 - 2 = 3.'),
        check('Failed removal changes nothing', "inv = Inventory(); inv.add('pen', 1)\ntry:\n    inv.remove('pen', 5)\n    assert False, 'No error'\nexcept ValueError as e:\n    assert str(e) == 'Not enough pen', str(e)\nassert inv.items['pen'] == 1, 'count changed to ' + str(inv.items['pen'])", 'Raise ValueError("Not enough pen") and leave the count at 1.'),
        check('low_stock', "inv = Inventory()\nfor n, q in [('zip', 1), ('apple', 2), ('bolt', 9), ('cord', 3)]:\n    inv.add(n, q)\nassert inv.low_stock(3) == ['apple', 'zip'], str(inv.low_stock(3))", 'Items with count below 3, alphabetically: apple, zip.'),
      ],
    },
    {
      title: 'Bug 3: The report',
      minutes: 2,
      prompt: '🐞 `report(inventory_dict)` should return lines like `"apple: 5"`, one per item, sorted by name, joined with newlines. It crashes and has a logic bug.',
      starter: 'def report(items):\n    lines = []\n    for name, qty in items:\n        lines.append(name + ": " + qty)\n    return "\\n".join(lines)\n',
      solution: 'def report(items):\n    lines = []\n    for name, qty in sorted(items.items()):\n        lines.append(f"{name}: {qty}")\n    return "\\n".join(lines)\n',
      solutionExplain: 'Looping over a dict gives only keys — use `.items()` for (name, qty) pairs. `name + ": " + qty` fails because qty is an int; an f-string fixes it. `sorted(...)` puts the pairs in name order.',
      hints: ['To get name AND qty pairs from a dict, loop over `items.items()`. You can\'t `+` a string and an int.', '`for name, qty in sorted(items.items()):` and `lines.append(f"{name}: {qty}")`.'],
      tests: [
        check('Sorted report', "assert report({'pear': 2, 'apple': 5}) == 'apple: 5\\npear: 2', repr(report({'pear': 2, 'apple': 5}))", 'Lines sorted by name: "apple: 5" then "pear: 2".'),
        check('Empty', "assert report({}) == ''", 'An empty inventory gives an empty string.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'bug',
      prompt: 'After `c = Counter()`, `c.count` raises AttributeError. Why?',
      code: 'class Counter:\n    def __init__(self):\n        count = 0',
      options: ['Counter needs a return', '`count = 0` is a local variable; it should be `self.count = 0`', '__init__ must be called manually', 'count is a reserved word'],
      answer: 1,
      explain: 'Without `self.`, the variable vanishes when `__init__` finishes.',
      concept: 'classes',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'stock = {"b": 1, "a": 2}\nfor k in stock:\n    print(k)',
      answers: ['b\na'],
      explain: 'Looping over a dict gives its keys, in the order they were added.',
      concept: 'dicts',
    },
    {
      kind: 'concept',
      prompt: 'Why should a method check its rules BEFORE changing state?',
      options: ['It runs faster', 'So a failed action leaves the object unchanged instead of half-updated', 'Python requires it', 'It doesn\'t matter'],
      answer: 1,
      explain: 'Validate first, then change. Otherwise an error can leave the object in a broken state.',
      concept: 'classes',
    },
  ],
});
