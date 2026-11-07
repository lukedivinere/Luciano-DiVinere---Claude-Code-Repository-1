import { call, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w1.l12',
  title: 'Bug Hunt',
  kind: 'debug',
  icon: '🐞',
  summary: 'Debug Mode: fix four broken programs',
  lang: 'python',
  teaches: ['debugging'],
  requires: ['functions', 'return', 'lists', 'while-loop', 'for-loop', 'if-else', 'fstrings', 'conversion'],
  learn: [
    {
      title: 'How to hunt bugs',
      minutes: 2,
      analogy: 'Debugging is **detective work**: gather clues (the error message, the output), form a theory, test it, repeat. Explaining the code out loud to a rubber duck works surprisingly well too!',
      body: `A **bug** is a mistake that makes a program crash or give the wrong answer. **Debugging** is finding and fixing it. A simple routine:

1. **Run it** and read the error. Code Quest translates it and shows the line number — start there (and check the line just above).
2. **Compare** what you expected with what you got.
3. **Add a print** to see what a variable holds at that moment: \`print("total is", total)\`.
4. **Change one thing at a time**, then run again.

Two kinds of bugs: **crashes** (Python stops with an error) and **logic bugs** (it runs but the answer is wrong). Logic bugs are sneakier — the tests will catch them.`,
      example: { lang: 'python', code: code`
        # A logic bug: this should average 4, 8 and 9 (= 7.0)
        nums = [4, 8, 9]
        total = 0
        for n in nums:
            total += n
            print("debug: total is now", total)   # a debug print
        print(total / 2)    # bug! should divide by len(nums)
      ` },
    },
  ],
  challenges: [
    {
      title: 'Bug 1: The even-number printer',
      minutes: 2,
      prompt: '🐞 This should print the even numbers from 2 to 10 (one per line), but it won\'t even run. Fix it.',
      starter: 'for i in range(2, 11)\nif i % 2 == 0:\n    print(i)\n',
      solution: 'for i in range(2, 11):\n    if i % 2 == 0:\n        print(i)\n',
      solutionExplain: 'Two bugs: the `for` line was missing its colon, and the `if` block wasn\'t indented under the loop, so it wasn\'t part of it.',
      hints: ['Run it: the error points at a missing piece of punctuation on line 1. After fixing that, run again — there\'s a second bug.', 'Add `:` after `range(2, 11)`, then indent the `if` and its `print` one more level so they are inside the loop.'],
      tests: [out('Prints 2 4 6 8 10', '2\n4\n6\n8\n10', 'Print each even number from 2 to 10.')],
    },
    {
      title: 'Bug 2: Off by one',
      minutes: 2,
      prompt: '🐞 This should add up 1 to 10 (answer `55`) but prints `45`. Find the off-by-one bug.',
      starter: 'total = 0\nfor i in range(1, 10):\n    total += i\nprint(total)\n',
      solution: 'total = 0\nfor i in range(1, 11):\n    total += i\nprint(total)\n',
      solutionExplain: '`range` stops BEFORE its end, so `range(1, 10)` misses 10. `range(1, 11)` includes it.',
      hints: ['45 is exactly 10 less than 55. Which number is missing?', '`range(1, 10)` stops at 9. Change it to `range(1, 11)`.'],
      tests: [out('Prints 55', '55', '1 + 2 + … + 10 = 55.')],
    },
    {
      title: 'Bug 3: The receipt',
      minutes: 2,
      prompt: `🐞 This receipt crashes. Fix it so that for 3 items at $4 it prints:

\`\`\`
Items: 3
Total: $12
\`\`\``,
      starter: 'qty = int(input("How many? "))\nprice = 4\ntotal = qty * price\nprint("Items: " + qty)\nprint("Total: $" + total)\n',
      solution: 'qty = int(input("How many? "))\nprice = 4\ntotal = qty * price\nprint(f"Items: {qty}")\nprint(f"Total: ${total}")\n',
      solutionExplain: 'You can\'t `+` a string and a number. f-strings (or `str(qty)`) turn the numbers into text for printing.',
      hints: ['The error says you can only concatenate str (not "int") to str.', 'Use f-strings: `print(f"Items: {qty}")` and `print(f"Total: ${total}")`.'],
      sampleInput: ['3'],
      tests: [
        out('3 items', 'Items: 3\nTotal: $12', 'Print the count and total without crashing.', ['3']),
        out('5 items', 'Items: 5\nTotal: $20', 'Use the typed quantity.', ['5']),
      ],
    },
    {
      title: 'Bug 4: The silent function',
      minutes: 2,
      prompt: '🐞 `average(nums)` should return the average of a list, but the caller always gets `None`. Fix the function.',
      starter: 'def average(nums):\n    total = 0\n    for n in nums:\n        total += n\n    print(total / len(nums))\n',
      solution: 'def average(nums):\n    total = 0\n    for n in nums:\n        total += n\n    return total / len(nums)\n',
      solutionExplain: 'The function printed the answer instead of returning it. Changing `print(...)` to `return ...` hands the value back to the caller.',
      hints: ['What\'s the difference between showing a value and giving it back?', 'Change the last line to `return total / len(nums)`.'],
      tests: [
        call('average', [[4, 8, 9]], 7.0, 'average([4, 8, 9]) should RETURN 7.0.'),
        call('average', [[10]], 10.0, 'average([10]) should return 10.0.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'bug',
      prompt: 'What\'s wrong with this code?',
      code: 'name = input("Name? ")\nif name == "Ada"\n    print("Hi Ada!")',
      options: ['Missing colon after the if condition', 'input needs int()', 'print shouldn\'t be indented', 'Ada needs single quotes'],
      answer: 0,
      explain: 'Every `if` line needs a colon at the end: `if name == "Ada":`.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this buggy code print?',
      code: 'count = 0\nfor word in ["a", "b", "c"]:\n    count = 1\nprint(count)',
      answers: ['1'],
      explain: '`count = 1` sets it to 1 every time instead of adding. The fix is `count += 1`, which would give 3.',
    },
    {
      kind: 'concept',
      prompt: 'Your program runs without errors but gives the wrong answer. What kind of bug is that?',
      options: ['A syntax error', 'A logic bug', 'A crash', 'Not a bug'],
      answer: 1,
      explain: 'Logic bugs don\'t crash — they just compute the wrong thing. Tests and debug prints help find them.',
    },
  ],
});
