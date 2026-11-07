import { code, defineLevel, out } from '../../dsl';

const ticket = (age: string, day: string, price: number, why: string) =>
  out(`Age ${age} on ${day} → $${price}`, `Ticket: $${price}`, why, [age, day]);

export default defineLevel({
  id: 'w1.l7',
  title: 'Logic',
  icon: '🧠',
  summary: 'Combine conditions with and, or, not',
  lang: 'python',
  teaches: ['logic'],
  requires: ['if-else', 'comparison', 'input', 'conversion'],
  learn: [
    {
      title: 'and, or, not',
      minutes: 3,
      analogy: 'A club bouncer: "You get in if you\'re on the list **and** over 18" is stricter than "on the list **or** with a VIP pass".',
      body: `**Logical operators** combine True/False values:

- \`a and b\` is True only if **both** are True.
- \`a or b\` is True if **at least one** is True.
- \`not a\` flips it: \`not True\` is \`False\`.

\`\`\`python
if age >= 8 and height >= 120:
    print("You can ride!")

if day == "Saturday" or day == "Sunday":
    print("Weekend!")
\`\`\`

A classic mistake: \`if day == "Saturday" or "Sunday":\` — that's always True! Each side of \`or\` must be a full comparison.

You can mix them, using brackets to be clear: \`(a or b) and not c\`.`,
      example: { lang: 'python', code: code`
        age = 10
        height = 125
        print(age >= 8 and height >= 120)
        print(age >= 18 or height >= 200)
        print(not age >= 18)

        day = "Sunday"
        if day == "Saturday" or day == "Sunday":
            print("Weekend!")
      ` },
    },
  ],
  practice: [
    {
      title: 'Can I ride?',
      minutes: 2,
      prompt: `Read an **age** and a **height** (cm). Riders must be **at least 8** years old **and** at least **120 cm** tall.

Print \`You can ride!\` or \`Sorry, not yet.\``,
      starter: 'age = int(input("Age? "))\nheight = int(input("Height (cm)? "))\n',
      solution: 'age = int(input("Age? "))\nheight = int(input("Height (cm)? "))\nif age >= 8 and height >= 120:\n    print("You can ride!")\nelse:\n    print("Sorry, not yet.")\n',
      solutionExplain: 'Both rules must be true, so they are joined with `and`.',
      hints: ['Both conditions must be true. Which operator needs both?', '`if age >= 8 and height >= 120:`'],
      sampleInput: ['9', '130'],
      tests: [
        out('9 years, 130 cm', 'You can ride!', 'Old enough and tall enough.', ['9', '130']),
        out('9 years, 110 cm', 'Sorry, not yet.', 'Too short — both rules must pass.', ['9', '110']),
        out('7 years, 140 cm', 'Sorry, not yet.', 'Too young — both rules must pass.', ['7', '140']),
        out('8 years, 120 cm (edge)', 'You can ride!', 'Exactly 8 and exactly 120 should be allowed — use >=.', ['8', '120']),
      ],
    },
    {
      title: 'Weekend checker',
      minutes: 2,
      prompt: 'Read a day name. Print `Weekend!` for `Saturday` or `Sunday`, otherwise `Weekday.`',
      starter: 'day = input("Day? ")\n',
      solution: 'day = input("Day? ")\nif day == "Saturday" or day == "Sunday":\n    print("Weekend!")\nelse:\n    print("Weekday.")\n',
      solutionExplain: 'Either day counts, so use `or` — with a full `day == ...` comparison on each side.',
      hints: ['Either day is enough. Remember each side of `or` needs its own `day == ...`.', '`if day == "Saturday" or day == "Sunday":`'],
      sampleInput: ['Sunday'],
      tests: [
        out('Saturday', 'Weekend!', 'Saturday is a weekend day.', ['Saturday']),
        out('Sunday', 'Weekend!', 'Sunday is a weekend day.', ['Sunday']),
        out('Monday', 'Weekday.', 'Monday is a weekday. If you wrote `or "Sunday"` without `day ==`, that is always True!', ['Monday']),
      ],
    },
  ],
  challenges: [
    {
      title: 'Cinema ticket pricing',
      minutes: 5,
      prompt: `Read an **age** and a **day**, then print the ticket price as \`Ticket: $X\`.

Rules:

1. Kids **under 5** go free: \`$0\`.
2. **65 or older** pay \`$6\`.
3. Everyone else pays \`$12\`.
4. On **Tuesday**, paid tickets are **half price** (use \`//\` so it stays a whole number). Free stays free.`,
      starter: 'age = int(input("Age? "))\nday = input("Day? ")\n',
      solution: 'age = int(input("Age? "))\nday = input("Day? ")\n\nif age < 5:\n    price = 0\nelif age >= 65:\n    price = 6\nelse:\n    price = 12\n\nif day == "Tuesday" and price > 0:\n    price = price // 2\n\nprint(f"Ticket: ${price}")\n',
      solutionExplain: 'First choose the base price with if/elif/else. Then a second, separate `if` applies the Tuesday discount — combining two conditions with `and`.',
      hints: [
        'Do it in two steps: first set `price` from the age (if/elif/else), then adjust it for Tuesday with a separate `if`.',
        'The discount check: `if day == "Tuesday" and price > 0:` then `price = price // 2`. Print with `f"Ticket: ${price}"`.',
      ],
      sampleInput: ['30', 'Tuesday'],
      tests: [
        ticket('30', 'Monday', 12, 'Adults pay $12 on normal days.'),
        ticket('30', 'Tuesday', 6, 'Tuesday is half price: 12 // 2 = 6.'),
        ticket('70', 'Friday', 6, 'Seniors (65+) pay $6.'),
        ticket('65', 'Tuesday', 3, '65 counts as senior (>= 65), and Tuesday halves it to $3.'),
        ticket('3', 'Tuesday', 0, 'Under 5 is free, even on Tuesday.'),
        ticket('5', 'Sunday', 12, 'Age 5 is not "under 5", so it\'s a normal $12 ticket.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'a = True\nb = False\nprint(a and b)\nprint(a or b)\nprint(not b)',
      answers: ['False\nTrue\nTrue'],
      explain: '`and` needs both (False). `or` needs one (True). `not False` is True.',
    },
    {
      kind: 'bug',
      prompt: 'This prints "Vowel!" for EVERY letter. Why?',
      code: 'letter = "z"\nif letter == "a" or "e":\n    print("Vowel!")',
      options: ['`or` should be `and`', '`"e"` on its own counts as True — it needs `letter == "e"`', 'Strings can\'t be compared', 'Missing else'],
      answer: 1,
      explain: 'Python reads it as `(letter == "a") or ("e")`. A non-empty string like "e" counts as True, so the condition is always True.',
    },
    {
      kind: 'concept',
      prompt: 'When is `x > 0 and x < 10` True?',
      options: ['When x is 0', 'When x is between 1 and 9 (for whole numbers)', 'When x is 10', 'Always'],
      answer: 1,
      explain: 'Both parts must be True: above 0 AND below 10.',
    },
  ],
});
