import { call, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w1.l11',
  title: 'Functions',
  icon: '🧩',
  summary: 'Package code with def, parameters and return',
  lang: 'python',
  teaches: ['functions', 'return'],
  requires: ['lists', 'for-loop', 'if-else', 'logic', 'strings', 'string-methods', 'math'],
  learn: [
    {
      title: 'Defining and calling functions',
      minutes: 2,
      analogy: 'A function is a **recipe card**: you write it once, give it a name, and then "cook" it whenever you want just by saying its name.',
      body: `A **function** is a named, reusable block of code. You've already used built-in ones like \`print\` and \`len\`. Now make your own with \`def\`:

\`\`\`python
def say_hello():
    print("Hello!")
    print("Welcome.")
\`\`\`

This **defines** the function — nothing runs yet. To run it, **call** it by name with brackets:

\`\`\`python
say_hello()
say_hello()
\`\`\`

The definition must come **before** the first call. The body is indented, just like an \`if\` or loop.`,
      example: { lang: 'python', code: code`
        def say_hello():
            print("Hello!")
            print("Welcome.")

        say_hello()
        say_hello()
      ` },
    },
    {
      title: 'Parameters and return',
      minutes: 3,
      analogy: 'A function is a **vending machine**: you put something in (the **arguments**), it does its work, and something comes out (the **return value**).',
      body: `**Parameters** are input variables listed in the brackets of \`def\`. The values you pass when calling are **arguments**:

\`\`\`python
def double(n):
    return n * 2

result = double(21)   # 21 is the argument
print(result)         # 42
\`\`\`

\`return\` sends a value back to whoever called the function, and **ends** the function immediately.

\`print\` vs \`return\`: \`print\` only shows a value on screen. \`return\` hands it back so your code can **use** it (store it, add to it, pass it on). A function without \`return\` gives back \`None\`, meaning "nothing".`,
      example: { lang: 'python', code: code`
        def double(n):
            return n * 2

        def greet(name, greeting):
            return f"{greeting}, {name}!"

        print(double(21))
        print(double(double(5)))
        message = greet("Ada", "Good morning")
        print(message)
      ` },
    },
  ],
  practice: [
    {
      title: 'greet(name)',
      minutes: 2,
      prompt: 'Write a function `greet(name)` that **returns** the string `"Hello, NAME!"`. For example `greet("Sam")` returns `"Hello, Sam!"`.',
      starter: 'def greet(name):\n    # return the greeting\n    pass\n',
      solution: 'def greet(name):\n    return f"Hello, {name}!"\n',
      solutionExplain: 'The f-string builds the text from the parameter, and `return` hands it back to the caller.',
      hints: ['Replace `pass` with a `return` line. (`pass` means "do nothing".)', '`return f"Hello, {name}!"`'],
      tests: [
        call('greet', ['Sam'], 'Hello, Sam!', 'Return (don\'t print) "Hello, " + the name + "!".'),
        call('greet', ['World'], 'Hello, World!', 'It should work for any name.'),
      ],
    },
    {
      title: 'square(n)',
      minutes: 1,
      prompt: 'Write `square(n)` that returns n multiplied by itself. `square(4)` → `16`.',
      starter: 'def square(n):\n    pass\n',
      solution: 'def square(n):\n    return n * n\n',
      solutionExplain: '`n * n` (or `n ** 2`) is returned to the caller.',
      hints: ['Use `return`, not print.', '`return n * n`'],
      tests: [
        call('square', [4], 16, 'square(4) should return 16.'),
        call('square', [-3], 9, 'square(-3) should return 9.'),
        call('square', [0], 0, 'square(0) should return 0.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Leap years and vowels',
      minutes: 6,
      prompt: `Write **two** functions:

**1. \`is_leap_year(year)\`** returns \`True\` or \`False\`. A year is a leap year if:
- it's divisible by 4, **and**
- it's **not** divisible by 100, **unless** it's also divisible by 400.

So 2024 → True, 2023 → False, 1900 → False, 2000 → True.

**2. \`count_vowels(text)\`** returns how many vowels (a, e, i, o, u — upper or lower case) are in \`text\`. \`count_vowels("Hello World")\` → \`3\`.`,
      starter: 'def is_leap_year(year):\n    pass\n\n\ndef count_vowels(text):\n    pass\n',
      solution: 'def is_leap_year(year):\n    if year % 400 == 0:\n        return True\n    if year % 100 == 0:\n        return False\n    return year % 4 == 0\n\n\ndef count_vowels(text):\n    count = 0\n    for ch in text.lower():\n        if ch in "aeiou":\n            count += 1\n    return count\n',
      solutionExplain: '`is_leap_year` checks the most specific rule first (÷400), then the exception (÷100), then the general rule (÷4) — each `return` ends the function. `count_vowels` lowercases the text, loops over each character, and uses `in "aeiou"` to test it.',
      hints: [
        'Leap year: check `% 400` first (True), then `% 100` (False), then `% 4`. For vowels: loop over `text.lower()` and count characters that are `in "aeiou"`.',
        '`return year % 4 == 0` returns True/False directly. For vowels: `if ch in "aeiou": count += 1`, then `return count` after the loop.',
      ],
      tests: [
        call('is_leap_year', [2024], true, '2024 is divisible by 4 and not by 100 → leap year.'),
        call('is_leap_year', [2023], false, '2023 is not divisible by 4.'),
        call('is_leap_year', [1900], false, '1900 is divisible by 100 but not 400 → NOT a leap year.'),
        call('is_leap_year', [2000], true, '2000 is divisible by 400 → leap year.'),
        call('count_vowels', ['Hello World'], 3, 'e, o, o → 3.'),
        call('count_vowels', ['AEIOU aeiou'], 10, 'Capital vowels count too — try lowercasing the text first.'),
        call('count_vowels', ['rhythm'], 0, 'No vowels → 0.'),
        call('count_vowels', [''], 0, 'Empty text → 0.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'def add(a, b):\n    return a + b\n\nprint(add(2, 3) * 10)',
      answers: ['50'],
      explain: '`add(2, 3)` returns 5, and 5 × 10 = 50. Because it RETURNS, you can use the result in more math.',
      concept: 'return',
    },
    {
      kind: 'bug',
      prompt: 'Why does this print `None`?',
      code: 'def double(n):\n    print(n * 2)\n\nresult = double(4)\nprint(result)',
      options: ['double is never called', 'The function prints but doesn\'t return, so result is None', '`n * 2` is wrong', 'result should be in quotes'],
      answer: 1,
      explain: 'The function shows 8 but returns nothing (None). Use `return n * 2` so the caller gets the value.',
      concept: 'return',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'def check(n):\n    if n > 0:\n        return "pos"\n    return "not pos"\n    print("end")\n\nprint(check(5))',
      answers: ['pos'],
      explain: '`return` ends the function immediately, so neither the second return nor `print("end")` runs.',
      concept: 'return',
    },
    {
      kind: 'concept',
      prompt: 'In `def area(width, height):`, what are `width` and `height`?',
      options: ['Arguments', 'Parameters', 'Return values', 'Global variables'],
      answer: 1,
      explain: 'Names in the `def` line are parameters. The actual values passed in a call, like `area(3, 4)`, are arguments.',
    },
  ],
});
