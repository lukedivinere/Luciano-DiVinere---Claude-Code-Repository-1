import { code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w1.l5',
  title: 'Input',
  icon: '⌨️',
  summary: 'Ask the user questions with input(); convert text to numbers',
  lang: 'python',
  teaches: ['input', 'conversion'],
  requires: ['print', 'variables', 'types', 'fstrings', 'math'],
  learn: [
    {
      title: 'Asking questions with input()',
      minutes: 2,
      analogy: '`input()` is the program **pausing to listen**, like a waiter waiting for your order before walking to the kitchen.',
      body: `\`input("question")\` shows the question, **waits** for the user to type an answer and press Enter, then gives back what they typed. You usually store it in a variable:

\`\`\`python
name = input("What is your name? ")
print(f"Hi, {name}!")
\`\`\`

In Code Quest, type your answers in the **Input** box under the editor (one per line) before pressing ▶ Run.

When the hidden tests run, they type answers for you automatically. Only what you \`print\` is checked — the question text inside \`input("...")\` isn't, so you can word it however you like.`,
      example: { lang: 'python', code: code`
        name = input("What is your name? ")
        color = input("Favorite color? ")
        print(f"{name} likes {color}.")
      `, sampleInput: ['Ada', 'purple'] },
    },
    {
      title: 'Text in, numbers out',
      minutes: 2,
      analogy: 'What you type is always delivered as **text in an envelope**. To do math you must open it and turn it into a number first.',
      body: `\`input()\` **always** returns a string, even if the user types \`42\`. So \`"3" + "5"\` gives \`"35"\` (text glued together), not 8!

**Type conversion** turns a value into another type:

- \`int("42")\` → \`42\` (whole number)
- \`float("2.5")\` → \`2.5\`
- \`str(42)\` → \`"42"\` (text)

Common pattern — convert as you read:

\`\`\`python
age = int(input("Age? "))
\`\`\`

If the text isn't a valid number, like \`int("ten")\`, Python raises a **ValueError**. (You'll learn to handle that in World 2.)`,
      example: { lang: 'python', code: code`
        a = input("First number: ")
        b = input("Second number: ")
        print("As text:", a + b)
        print("As numbers:", int(a) + int(b))
      `, sampleInput: ['3', '5'] },
    },
  ],
  practice: [
    {
      title: 'Nice to meet you',
      minutes: 2,
      prompt: `Ask for the user's name with \`input()\`, then print \`Nice to meet you, NAME!\`.

If they type \`Zoe\`, the output is:

\`\`\`
Nice to meet you, Zoe!
\`\`\``,
      starter: '# Ask for a name, then greet\n',
      solution: 'name = input("What is your name? ")\nprint(f"Nice to meet you, {name}!")\n',
      solutionExplain: '`input` returns the typed text, which we store in `name` and put into an f-string.',
      hints: ['Store the result of `input(...)` in a variable, then print an f-string.', '`name = input("Name? ")` then `print(f"Nice to meet you, {name}!")`.'],
      sampleInput: ['Zoe'],
      tests: [
        out('Typing Zoe', 'Nice to meet you, Zoe!', 'Greet the name that was typed.', ['Zoe']),
        out('Typing Kwame', 'Nice to meet you, Kwame!', 'Use the typed name, not a fixed one.', ['Kwame']),
      ],
    },
    {
      title: 'The 3 + 5 = 35 bug',
      type: 'debug',
      minutes: 2,
      prompt: `🐞 This adder prints \`35\` when you type \`3\` and \`5\`. Fix it so it prints the real sum:

\`\`\`
Sum: 8
\`\`\``,
      starter: 'a = input("First: ")\nb = input("Second: ")\nprint("Sum:", a + b)\n',
      solution: 'a = int(input("First: "))\nb = int(input("Second: "))\nprint("Sum:", a + b)\n',
      solutionExplain: '`input` gives text, and `+` on text glues it. Wrapping each `input(...)` in `int(...)` turns the text into numbers so `+` adds.',
      hints: ['What type does `input()` return? What does `+` do to two strings?', 'Wrap each input in `int(...)`: `a = int(input("First: "))`.'],
      sampleInput: ['3', '5'],
      tests: [
        out('3 + 5', 'Sum: 8', 'Convert the inputs to numbers before adding.', ['3', '5']),
        out('10 + 32', 'Sum: 42', 'Convert the inputs to numbers before adding.', ['10', '32']),
      ],
    },
  ],
  challenges: [
    {
      title: 'Age in days',
      minutes: 3,
      prompt: `Ask for a **name** and then an **age** in years. Print roughly how many days old they are (use 365 days per year):

If they type \`Mo\` then \`12\`:

\`\`\`
Mo, you are about 4380 days old!
\`\`\``,
      starter: '# Ask for name, then age\n',
      solution: 'name = input("Name? ")\nage = int(input("Age? "))\ndays = age * 365\nprint(f"{name}, you are about {days} days old!")\n',
      solutionExplain: 'Read the name as text, read the age and convert it with `int()`, multiply by 365, and put both into an f-string.',
      hints: ['Two `input()` calls: name first, then age. The age needs `int()` before you can multiply.', '`days = int(input("Age? ")) * 365`, then an f-string with `{name}` and `{days}`.'],
      sampleInput: ['Mo', '12'],
      tests: [
        out('Mo, 12', 'Mo, you are about 4380 days old!', 'Name first, age second; 12 × 365 = 4380.', ['Mo', '12']),
        out('Priya, 30', 'Priya, you are about 10950 days old!', 'Use the typed name and age.', ['Priya', '30']),
        out('Baby, 0', 'Baby, you are about 0 days old!', 'Age 0 should give 0 days.', ['Baby', '0']),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'The user types `4`. What does this print?',
      code: 'x = input()\nprint(x * 3)',
      answers: ['444'],
      explain: '`x` is the TEXT "4". Multiplying text repeats it: "4" × 3 = "444".',
      concept: 'conversion',
    },
    {
      kind: 'concept',
      prompt: 'What type does `input()` always return?',
      options: ['int', 'float', 'str', 'Whatever the user typed'],
      answer: 2,
      explain: 'Always a string. Convert with `int()` or `float()` to do math.',
      concept: 'input',
    },
    {
      kind: 'bug',
      prompt: 'The user types `2.5`. Which line crashes?',
      code: '1  price = input("Price? ")\n2  qty = 3\n3  total = int(price) * qty\n4  print(total)',
      options: ['Line 1', 'Line 2', 'Line 3', 'Line 4'],
      answer: 2,
      explain: '`int("2.5")` fails with ValueError — "2.5" isn\'t a whole number. Use `float(price)` instead.',
      concept: 'conversion',
    },
  ],
});
