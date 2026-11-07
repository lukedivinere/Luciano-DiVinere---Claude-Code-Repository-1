import { call, check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w2.l4',
  title: 'Scope',
  icon: '🔭',
  summary: 'Where variables live, and why globals bite',
  lang: 'python',
  teaches: ['scope'],
  requires: ['functions', 'return', 'parameters'],
  learn: [
    {
      title: 'Local vs global',
      minutes: 3,
      analogy: 'Each function call is like a **hotel room**: you can see the lobby (global variables) from your room, but whatever you put in your room (local variables) is cleared out when you check out.',
      body: `**Scope** is where a variable can be seen.

- A variable created **inside** a function is **local**: it exists only while that function runs.
- A variable created at the top level of the file is **global**: functions can **read** it.

\`\`\`python
def make():
    secret = 42      # local
make()
print(secret)        # NameError!
\`\`\`

The trap: if a function **assigns** to a name, Python treats that name as local for the whole function. So \`count += 1\` on a global \`count\` crashes with **UnboundLocalError**.

The \`global\` keyword can force it, but the better habit is: **pass values in as parameters and return results**.`,
      example: { lang: 'python', code: code`
        tax_rate = 0.2            # global

        def price_with_tax(price):
            tax = price * tax_rate   # reading a global is fine
            return price + tax       # 'tax' is local

        print(price_with_tax(10))
        # print(tax)  # uncomment: NameError, tax only lived inside the function
      ` },
    },
    {
      title: 'Pure functions',
      minutes: 2,
      analogy: 'A **pure function** is like a calculator button: same input, same output, every time — and it never secretly changes anything else.',
      body: `A **pure function**:

1. gets everything it needs through its **parameters**, and
2. gives back its result with **return**, without changing outside variables.

\`\`\`python
# Impure: depends on and changes a global
score = 0
def add_points(points):
    global score
    score += points

# Pure: in → out
def add_points(score, points):
    return score + points

score = add_points(score, 10)
\`\`\`

Pure functions are easier to test, reuse and debug, because you can understand each one on its own.`,
      example: { lang: 'python', code: code`
        def add_points(score, points):
            return score + points

        score = 0
        score = add_points(score, 10)
        score = add_points(score, 5)
        print(score)
      ` },
    },
  ],
  practice: [
    {
      title: 'UnboundLocalError',
      type: 'debug',
      minutes: 2,
      prompt: '🐞 Run this: it crashes. Fix it by making `increment` take the count as a **parameter** and **return** the new value. The program should print `3`.',
      starter: 'count = 0\n\ndef increment():\n    count += 1\n\nincrement()\nincrement()\nincrement()\nprint(count)\n',
      solution: 'count = 0\n\ndef increment(count):\n    return count + 1\n\ncount = increment(count)\ncount = increment(count)\ncount = increment(count)\nprint(count)\n',
      solutionExplain: 'Assigning to `count` inside the function made it local, so Python couldn\'t read it first. Passing it in and returning the result avoids the global entirely.',
      hints: ['Change the function to `def increment(count):` and `return count + 1`.', 'Each call must store the result: `count = increment(count)`.'],
      tests: [
        out('Prints 3', '3', 'Three increments from 0 should give 3.'),
        check('No global keyword', "assert 'global' not in CODE", 'Solve it with a parameter and return, not `global`.'),
        call('increment', [41], 42, 'increment(41) should return 42.'),
      ],
    },
    {
      title: 'Make it pure',
      minutes: 2,
      prompt: '`with_discount` secretly uses the global `DISCOUNT`. Change it to take the discount as a parameter `discount` with a **default of 0.1**, so `with_discount(50)` → `45.0` and `with_discount(50, 0.5)` → `25.0`.',
      starter: 'DISCOUNT = 0.1\n\ndef with_discount(price):\n    return price * (1 - DISCOUNT)\n',
      solution: 'def with_discount(price, discount=0.1):\n    return price * (1 - discount)\n',
      solutionExplain: 'The function now depends only on its parameters, and the default keeps the old behavior.',
      hints: ['Add a second parameter with a default value.', '`def with_discount(price, discount=0.1):`'],
      tests: [
        call('with_discount', [50], 45.0, 'Default discount is 10%.'),
        call('with_discount', [50, 0.5], 25.0, 'A 50% discount halves the price.'),
        call('with_discount', [80, 0], 80.0, 'A 0 discount keeps the price.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Refactor the score keeper',
      minutes: 4,
      prompt: `This score keeper uses globals everywhere. Rewrite it as **two pure functions** (no \`global\`):

- \`add_points(score, points)\` → the new score. Points can't make the score go below 0 (if the result is negative, return 0).
- \`apply_bonus(score, multiplier=2)\` → the score times the multiplier, as a whole number (use \`int()\`).`,
      starter: 'score = 0\nmultiplier = 2\n\ndef add_points(points):\n    global score\n    score = score + points\n\ndef apply_bonus():\n    global score\n    score = score * multiplier\n',
      solution: 'def add_points(score, points):\n    new_score = score + points\n    if new_score < 0:\n        return 0\n    return new_score\n\n\ndef apply_bonus(score, multiplier=2):\n    return int(score * multiplier)\n',
      solutionExplain: 'Each function now receives the score and returns a new one. Nothing outside is changed, so you can test `add_points(5, -10)` on its own and know it returns 0.',
      hints: ['Both functions take `score` as their first parameter and `return` the result instead of changing a global.', '`add_points`: compute `score + points`, return 0 if it\'s negative. `apply_bonus`: `return int(score * multiplier)`.'],
      tests: [
        call('add_points', [10, 5], 15, '10 + 5 = 15.'),
        call('add_points', [5, -10], 0, 'The score can\'t go below 0.'),
        call('add_points', [0, 0], 0, 'Adding nothing changes nothing.'),
        call('apply_bonus', [15], 30, 'Default multiplier is 2.'),
        call('apply_bonus', [10, 1.5], 15, 'A 1.5x bonus on 10 is 15 (as an int).'),
        check('No globals', "assert 'global' not in CODE, 'Remove the global statements'", 'Pure functions don\'t use `global`.'),
        check('Repeatable', "assert add_points(1, 1) == 2 and add_points(1, 1) == 2", 'Calling with the same inputs must always give the same output.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'x = 10\n\ndef f():\n    x = 99\n    return x\n\nprint(f(), x)',
      answers: ['99 10'],
      explain: 'The `x = 99` inside `f` creates a separate local x. The global x stays 10.',
    },
    {
      kind: 'bug',
      prompt: 'Why does `print(total)` crash with NameError?',
      code: 'def add(a, b):\n    total = a + b\n\nadd(2, 3)\nprint(total)',
      options: ['add is never called', '`total` is local to `add`; it should be returned', '`a + b` is wrong', 'print needs quotes'],
      answer: 1,
      explain: 'Local variables vanish when the function ends. `return total` and store it: `total = add(2, 3)`.',
    },
    {
      kind: 'concept',
      prompt: 'Which is a pure function?',
      options: ['One that changes a global variable', 'One whose output depends only on its inputs and changes nothing outside', 'One that prints instead of returning', 'One with no parameters'],
      answer: 1,
      explain: 'Pure = same inputs give the same output, with no side effects.',
    },
  ],
});
