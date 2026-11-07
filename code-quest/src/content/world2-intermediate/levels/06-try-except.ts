import { call, check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w2.l6',
  title: 'Handling Errors',
  icon: '🛡️',
  summary: 'try / except / else / finally, and raising your own errors',
  lang: 'python',
  teaches: ['try-except'],
  requires: ['tracebacks', 'functions', 'return', 'conversion', 'while-loop', 'break'],
  learn: [
    {
      title: 'try and except',
      minutes: 3,
      analogy: 'A **safety net** under a trapeze: you still try the trick, but if you fall, the net catches you and the show goes on.',
      body: `Some errors can't be prevented — a user types "ten" instead of 10, a file is missing. **Exception handling** lets your program react instead of crashing. An **exception** is the error object Python raises.

\`\`\`python
try:
    age = int(input("Age? "))
    print("Next year:", age + 1)
except ValueError:
    print("That's not a number!")
\`\`\`

Python runs the \`try\` block. If a \`ValueError\` happens inside it, Python jumps straight to the matching \`except\` block instead of crashing.

Always name the **specific** error you expect. A bare \`except:\` catches everything — even your own typos — and hides real bugs.`,
      example: { lang: 'python', code: code`
        for text in ["42", "ten", "7"]:
            try:
                n = int(text)
                print(text, "->", n * 2)
            except ValueError:
                print(text, "-> not a number, skipping")
      ` },
    },
    {
      title: 'else, finally and raise',
      minutes: 3,
      analogy: '`raise` is **pulling the fire alarm** yourself: when your function spots something wrong, it stops and alerts whoever called it.',
      body: `More pieces:

- \`except (ValueError, ZeroDivisionError):\` catches either type.
- \`except ValueError as e:\` gives you the error so you can print its message.
- \`else:\` runs only if **no** error happened.
- \`finally:\` runs **always** — useful for cleanup.

Your own functions can **raise** exceptions when given bad data:

\`\`\`python
def set_age(age):
    if age < 0:
        raise ValueError("Age can't be negative")
    return age
\`\`\`

The caller decides how to handle it. Raising early with a clear message beats returning a wrong answer silently.`,
      example: { lang: 'python', code: code`
        def safe_divide(a, b):
            try:
                result = a / b
            except ZeroDivisionError:
                print("Can't divide by zero")
                return None
            else:
                print("Worked!")
                return result
            finally:
                print("(division attempted)")

        print(safe_divide(10, 2))
        print(safe_divide(1, 0))
      ` },
    },
  ],
  practice: [
    {
      title: 'Ask until it\'s a number',
      minutes: 3,
      prompt: `Keep asking for a whole number until the user types a valid one. For each bad entry print \`That's not a number!\`. When valid, print \`Got N\`.

Typing \`abc\`, \`4.5\`, \`7\`:

\`\`\`
That's not a number!
That's not a number!
Got 7
\`\`\``,
      starter: '# Loop until int(input()) works\n',
      solution: 'while True:\n    try:\n        n = int(input("Number? "))\n        break\n    except ValueError:\n        print("That\'s not a number!")\nprint(f"Got {n}")\n',
      solutionExplain: 'The `break` only runs if `int()` succeeded. A ValueError skips straight to the except, prints the message, and the loop asks again.',
      hints: ['Put the `try` inside a `while True:` loop. `break` right after a successful `int()`.', '`except ValueError:` prints the message; after the loop print `f"Got {n}"`.'],
      sampleInput: ['abc', '4.5', '7'],
      tests: [
        out('abc, 4.5, 7', "That's not a number!\nThat's not a number!\nGot 7", 'Keep asking until int() works.', ['abc', '4.5', '7']),
        out('Valid first time', 'Got 12', 'A valid number on the first try needs no error message.', ['12']),
        out('Negative is fine', "That's not a number!\nGot -3", '-3 is a valid whole number.', ['', '-3']),
      ],
    },
    {
      title: 'safe_divide',
      minutes: 2,
      prompt: 'Write `safe_divide(a, b)` that returns `a / b`, or `None` if `b` is zero. Use try/except — not an if.',
      starter: 'def safe_divide(a, b):\n    return a / b\n',
      solution: 'def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None\n',
      solutionExplain: 'The division is attempted inside `try`; a ZeroDivisionError is caught and turned into `None`.',
      hints: ['Wrap the division in `try:` and catch `ZeroDivisionError`.', '`except ZeroDivisionError: return None`'],
      tests: [
        call('safe_divide', [10, 4], 2.5, '10 / 4 = 2.5.'),
        call('safe_divide', [1, 0], null, 'Dividing by zero should return None.'),
        check('Uses try/except', "assert 'try' in CODE and 'except ZeroDivisionError' in CODE", 'Practice the pattern: catch `ZeroDivisionError` specifically.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Robust price parser',
      minutes: 6,
      prompt: `Shop data is messy. Write \`parse_price(text)\` that turns text into a float:

- Ignore spaces at the start/end and an optional \`$\` at the start: \`" $4.50 "\` → \`4.5\`, \`"3"\` → \`3.0\`
- If the text isn't a number, **raise** \`ValueError\` with the message \`Invalid price: TEXT\` (the original text).
- If the number is **negative**, raise \`ValueError("Negative price: TEXT")\`.

Then write \`total_prices(texts)\` that adds up all the **valid** prices in a list, **skipping** invalid ones, rounded to 2 decimals.

Useful: \`s.strip()\` removes surrounding spaces; \`s.replace("$", "")\` removes dollar signs.`,
      starter: 'def parse_price(text):\n    pass\n\n\ndef total_prices(texts):\n    pass\n',
      solution: 'def parse_price(text):\n    cleaned = text.strip().replace("$", "")\n    try:\n        value = float(cleaned)\n    except ValueError:\n        raise ValueError(f"Invalid price: {text}")\n    if value < 0:\n        raise ValueError(f"Negative price: {text}")\n    return value\n\n\ndef total_prices(texts):\n    total = 0\n    for t in texts:\n        try:\n            total += parse_price(t)\n        except ValueError:\n            pass\n    return round(total, 2)\n',
      solutionExplain: '`parse_price` cleans the text, converts it inside `try`, and re-raises a ValueError with a clearer message. `total_prices` calls it for each item and uses `except ValueError: pass` to skip bad ones — the caller decides what to do with errors.',
      hints: [
        'Clean with `text.strip().replace("$", "")`, then `float(...)` inside a `try`. In the `except ValueError:` raise a new `ValueError(f"Invalid price: {text}")`.',
        'In `total_prices`, wrap `parse_price(t)` in try/except and use `pass` (do nothing) to skip invalid prices.',
      ],
      tests: [
        call('parse_price', [' $4.50 '], 4.5, 'Strip spaces and the $.'),
        call('parse_price', ['3'], 3.0, 'A plain number works too.'),
        check('Garbage raises ValueError with message', "try:\n    parse_price('abc')\n    assert False, 'No error was raised'\nexcept ValueError as e:\n    assert str(e) == 'Invalid price: abc', 'Message was: ' + str(e)", 'parse_price("abc") should raise ValueError("Invalid price: abc").'),
        check('Negative raises ValueError', "try:\n    parse_price('-2')\n    assert False, 'No error was raised'\nexcept ValueError as e:\n    assert str(e) == 'Negative price: -2', 'Message was: ' + str(e)", 'parse_price("-2") should raise ValueError("Negative price: -2").'),
        call('total_prices', [['$1.10', 'oops', ' 2.20', '-5', '$0.70']], 4.0, 'Only 1.10 + 2.20 + 0.70 are valid → 4.0.'),
        call('total_prices', [[]], 0, 'An empty list totals 0.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'try:\n    print("A")\n    x = 1 / 0\n    print("B")\nexcept ZeroDivisionError:\n    print("C")\nprint("D")',
      answers: ['A\nC\nD'],
      explain: 'A prints, then the division fails — so B is skipped and the except prints C. The program continues with D.',
    },
    {
      kind: 'bug',
      prompt: 'What\'s the problem with this code?',
      code: 'try:\n    total = pric * 2\nexcept:\n    print("Something went wrong")',
      options: ['Nothing', 'The bare `except:` hides the NameError typo `pric`', 'try needs finally', '`*` should be `+`'],
      answer: 1,
      explain: 'A bare except swallows every error, including real bugs. Catch only the specific errors you expect.',
    },
    {
      kind: 'concept',
      prompt: 'When does a `finally` block run?',
      options: ['Only if there was an error', 'Only if there was no error', 'Always', 'Never'],
      answer: 2,
      explain: '`finally` always runs, error or not — perfect for cleanup.',
    },
  ],
});
