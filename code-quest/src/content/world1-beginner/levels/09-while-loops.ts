import { code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w1.l9',
  title: 'while Loops',
  icon: '♾️',
  summary: 'Loop until something happens; break out early',
  lang: 'python',
  teaches: ['while-loop', 'break'],
  requires: ['for-loop', 'if-else', 'comparison', 'input', 'conversion', 'fstrings', 'logic'],
  learn: [
    {
      title: 'Looping while a condition holds',
      minutes: 2,
      analogy: 'A `while` loop is **"keep stirring while the soup is lumpy"** — you don\'t know how many stirs it takes, you just check each time.',
      body: `A \`while\` loop repeats as long as its condition is True:

\`\`\`python
count = 3
while count > 0:
    print(count)
    count -= 1
print("Liftoff!")
\`\`\`

Use \`for\` when you know how many times to repeat; use \`while\` when you repeat **until something happens** (a correct answer, a "quit" command…).

⚠️ If nothing inside the loop ever makes the condition False, it runs forever — an **infinite loop**. Code Quest stops your code after a few seconds if that happens, and tells you.`,
      example: { lang: 'python', code: code`
        count = 3
        while count > 0:
            print(count)
            count -= 1      # without this line, it would never stop!
        print("Liftoff!")
      ` },
    },
    {
      title: 'break: leaving early',
      minutes: 2,
      analogy: '`break` is the **emergency exit**: the moment you go through it, you\'re out of the loop, no matter what the condition says.',
      body: `\`break\` immediately ends the loop it's in. Python jumps to the first line after the loop.

A very common pattern is a loop that keeps asking until the user says stop:

\`\`\`python
while True:
    word = input("Word (or quit): ")
    if word == "quit":
        break
    print(word.upper())
print("Bye!")
\`\`\`

\`while True\` would loop forever on its own — the \`break\` is the only way out. This is fine as long as a \`break\` is guaranteed to happen eventually.`,
      example: { lang: 'python', code: code`
        while True:
            word = input("Word (or quit): ")
            if word == "quit":
                break
            print(word.upper())
        print("Bye!")
      `, sampleInput: ['hello', 'loops', 'quit'] },
    },
  ],
  practice: [
    {
      title: 'Countdown',
      minutes: 2,
      prompt: 'Read a number `n`. Using a `while` loop, count down from n to 1 (one per line), then print `Liftoff!`.',
      starter: 'n = int(input("Start from? "))\n',
      solution: 'n = int(input("Start from? "))\nwhile n > 0:\n    print(n)\n    n -= 1\nprint("Liftoff!")\n',
      solutionExplain: 'The loop runs while n is above 0, printing and then decreasing n so the loop eventually ends.',
      hints: ['The condition is `n > 0`. Inside: print n, then make n one smaller.', '`while n > 0:` → `print(n)` → `n -= 1`. Then `print("Liftoff!")` after the loop.'],
      sampleInput: ['3'],
      tests: [
        out('From 3', '3\n2\n1\nLiftoff!', 'Count 3, 2, 1, then Liftoff!', ['3']),
        out('From 1', '1\nLiftoff!', 'From 1: just 1, then Liftoff!', ['1']),
        out('From 0', 'Liftoff!', 'From 0 there is nothing to count — just Liftoff!', ['0']),
      ],
    },
    {
      title: 'Repeat after me',
      minutes: 2,
      prompt: 'Keep reading words. Print each one in UPPERCASE. When the word is `quit`, stop (don\'t print it) and print `Bye!`.',
      starter: '',
      solution: 'while True:\n    word = input("Word? ")\n    if word == "quit":\n        break\n    print(word.upper())\nprint("Bye!")\n',
      solutionExplain: '`while True` keeps asking; the `if` with `break` is the only exit, checked before printing so "quit" itself isn\'t printed.',
      hints: ['Use `while True:` and inside it read a word. Check for "quit" BEFORE printing.', 'Inside the loop: `word = input()`, then `if word == "quit": break`, then `print(word.upper())`.'],
      sampleInput: ['hi', 'there', 'quit'],
      tests: [
        out('hi, there, quit', 'HI\nTHERE\nBye!', 'Print each word in uppercase until "quit".', ['hi', 'there', 'quit']),
        out('quit straight away', 'Bye!', 'If the first word is quit, just print Bye!', ['quit']),
      ],
    },
  ],
  challenges: [
    {
      title: 'Three strikes password',
      minutes: 5,
      prompt: `The secret password is \`opensesame\`. Give the user **3 tries**:

- Correct: print \`Welcome in!\` and stop asking.
- Wrong: print \`Wrong password. N tries left.\` (N = tries remaining).
- After the 3rd wrong try, print \`Locked out!\` instead of the "tries left" line.

Example — typing \`hello\`, then \`opensesame\`:

\`\`\`
Wrong password. 2 tries left.
Welcome in!
\`\`\``,
      starter: 'tries_left = 3\n',
      solution: 'tries_left = 3\nwhile tries_left > 0:\n    guess = input("Password: ")\n    if guess == "opensesame":\n        print("Welcome in!")\n        break\n    tries_left -= 1\n    if tries_left > 0:\n        print(f"Wrong password. {tries_left} tries left.")\n    else:\n        print("Locked out!")\n',
      solutionExplain: 'The loop runs while tries remain. A correct guess prints the welcome and `break`s. A wrong one uses up a try, then shows either the remaining count or, at zero, the lock-out message.',
      hints: [
        'Loop `while tries_left > 0:`. Read a guess; if it\'s right, welcome and `break`. Otherwise subtract 1 from tries_left.',
        'After `tries_left -= 1`, use `if tries_left > 0:` to print the "tries left" message, `else:` print "Locked out!".',
      ],
      sampleInput: ['hello', 'opensesame'],
      tests: [
        out('Right first time', 'Welcome in!', 'A correct first guess goes straight in.', ['opensesame']),
        out('Wrong then right', 'Wrong password. 2 tries left.\nWelcome in!', 'One wrong guess leaves 2 tries.', ['hello', 'opensesame']),
        out('Right on the last try', 'Wrong password. 2 tries left.\nWrong password. 1 tries left.\nWelcome in!', 'The third try still gets in if correct.', ['a', 'b', 'opensesame']),
        out('Three wrong', 'Wrong password. 2 tries left.\nWrong password. 1 tries left.\nLocked out!', 'After 3 wrong tries print Locked out! and stop asking.', ['a', 'b', 'c']),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'x = 1\nwhile x < 20:\n    x = x * 3\nprint(x)',
      answers: ['27'],
      explain: 'x goes 1 → 3 → 9 → 27. At 27, `x < 20` is False, so the loop stops.',
    },
    {
      kind: 'bug',
      prompt: 'Why does this loop never end?',
      code: 'n = 5\nwhile n > 0:\n    print(n)\nprint("done")',
      options: ['`n > 0` should be `n >= 0`', 'n never changes inside the loop', 'print can\'t be in a loop', '`while` needs `range`'],
      answer: 1,
      explain: 'Nothing changes n, so `n > 0` stays True forever. Add `n -= 1` inside the loop.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'for i in range(10):\n    if i == 3:\n        break\n    print(i)',
      answers: ['0\n1\n2'],
      explain: 'When i reaches 3, `break` exits the loop before printing. `break` works in `for` loops too.',
      concept: 'break',
    },
    {
      kind: 'concept',
      prompt: 'When is a `while` loop a better choice than a `for` loop?',
      options: ['When you know exactly how many repeats you need', 'When you repeat until something happens', 'Never', 'Only for printing'],
      answer: 1,
      explain: '`for` = a known number of repeats; `while` = repeat until a condition changes.',
    },
  ],
});
