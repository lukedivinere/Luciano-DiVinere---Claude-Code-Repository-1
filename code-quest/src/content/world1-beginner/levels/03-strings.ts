import { check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w1.l3',
  title: 'Strings',
  icon: '🧵',
  summary: 'Join text, f-strings, len(), upper/lower and indexing',
  lang: 'python',
  teaches: ['strings', 'fstrings', 'string-methods', 'indexing'],
  requires: ['print', 'variables', 'types'],
  learn: [
    {
      title: 'Joining text and f-strings',
      minutes: 2,
      analogy: 'An **f-string** is a fill-in-the-blanks form. You write the sentence once and leave `{slots}` that Python fills with values.',
      body: `You can glue strings together with \`+\`. This is called **concatenation**:

\`\`\`python
first = "Ada"
print("Hi " + first + "!")     # Hi Ada!
\`\`\`

Notice you must add the spaces yourself.

An easier way is an **f-string**: put \`f\` right before the opening quote, then write variables inside \`{curly braces}\`:

\`\`\`python
print(f"Hi {first}!")         # Hi Ada!
\`\`\`

f-strings can hold any value, even numbers and math: \`f"{2 + 3} apples"\` → \`5 apples\`. You'll use them constantly.`,
      example: { lang: 'python', code: code`
        first = "Ada"
        last = "Lovelace"
        age = 36

        print("Hi " + first + " " + last)
        print(f"{first} is {age} years old")
        print(f"Next year: {age + 1}")
      ` },
    },
    {
      title: 'Length, methods and positions',
      minutes: 3,
      analogy: 'A string is a row of **numbered seats**, one letter per seat — and the numbering starts at **0**, not 1.',
      body: `- \`len(s)\` gives the **length**: how many characters (letters, spaces, symbols) are in \`s\`.
- A **method** is an action that belongs to a value. You call it with a dot: \`s.upper()\` makes an UPPERCASE copy; \`s.lower()\` makes a lowercase copy. The original isn't changed.
- **Indexing** gets one character by its position (its **index**): \`s[0]\` is the first character, \`s[1]\` the second.
- Negative indexes count from the end: \`s[-1]\` is the last character.

\`\`\`python
word = "python"
word[0]    # 'p'
word[-1]   # 'n'
\`\`\`

Asking for a position that doesn't exist (like \`word[10]\`) causes an **IndexError**.`,
      example: { lang: 'python', code: code`
        word = "python"
        print(len(word))
        print(word.upper())
        print(word[0], word[1], word[-1])
        print(f"{word} starts with {word[0].upper()}")
      ` },
    },
  ],
  practice: [
    {
      title: 'Welcome message',
      minutes: 2,
      prompt: `Use an **f-string** with the variable \`name\` to print:

\`\`\`
Hi, Sam! Welcome to Code Quest.
\`\`\``,
      starter: 'name = "Sam"\n# Print the welcome using an f-string\n',
      solution: 'name = "Sam"\nprint(f"Hi, {name}! Welcome to Code Quest.")\n',
      solutionExplain: 'The `f` before the quote turns on fill-in mode, and `{name}` is replaced with "Sam".',
      hints: ['Start the string with `f"` and put `{name}` where the name goes.', '`print(f"Hi, {name}! Welcome to Code Quest.")`'],
      tests: [
        out('Prints the welcome', 'Hi, Sam! Welcome to Code Quest.', 'Check commas, the exclamation mark and the full stop at the end.'),
        check('Uses the variable', "assert 'Kai' in RUN(CODE.replace('\"Sam\"', '\"Kai\"')), 'Use {name} instead of typing Sam'", 'Use `{name}` inside the f-string rather than typing "Sam".'),
      ],
    },
    {
      title: 'First and last letter',
      minutes: 2,
      prompt: `Print the **first** letter of \`word\` on one line and the **last** letter on the next. For \`"python"\` that's:

\`\`\`
p
n
\`\`\`

It should work for any word, so use indexing — don't type the letters.`,
      starter: 'word = "python"\n',
      solution: 'word = "python"\nprint(word[0])\nprint(word[-1])\n',
      solutionExplain: '`word[0]` is the first seat; `word[-1]` counts back from the end, so it is always the last letter.',
      hints: ['Positions start at 0. Negative positions count from the end.', '`print(word[0])` and `print(word[-1])`.'],
      tests: [
        out('Prints p and n', 'p\nn', 'First letter on line 1, last letter on line 2.'),
        check('Works for another word', "assert RUN(CODE.replace('\"python\"', '\"quest\"')).split() == ['q', 't'], 'Use word[0] and word[-1]'", 'With word = "quest" your program should print q and t.'),
      ],
    },
    {
      title: 'SHOUT IT',
      minutes: 2,
      prompt: `Print \`msg\` in uppercase followed by an exclamation mark, then print how many characters \`msg\` has:

\`\`\`
HELLO THERE!
11
\`\`\``,
      starter: 'msg = "hello there"\n',
      solution: 'msg = "hello there"\nprint(msg.upper() + "!")\nprint(len(msg))\n',
      solutionExplain: '`msg.upper()` makes an uppercase copy, `+ "!"` glues on the mark. `len(msg)` counts all 11 characters, including the space.',
      hints: ['`.upper()` gives an uppercase copy; `len()` counts characters (spaces count too!).', '`print(msg.upper() + "!")` then `print(len(msg))`.'],
      tests: [
        out('Shouts and counts', 'HELLO THERE!\n11', 'Line 1: uppercase with "!" on the end. Line 2: the length.'),
        check('Works for other text', "assert RUN(CODE.replace('\"hello there\"', '\"hi\"')).split() == ['HI!', '2']", 'With msg = "hi" your program should print HI! and 2.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Username generator',
      minutes: 4,
      prompt: `A sign-up form gives you \`first\` and \`last\` names in any capitalization. Print three lines:

1. The **initials** in capitals with dots, e.g. \`G.H.\`
2. A **username**: first name, an underscore, last name, all lowercase, e.g. \`grace_hopper\`
3. How many letters are in the full name (first + last), like \`11 letters\`

For \`first = "Grace"\`, \`last = "HOPPER"\`:

\`\`\`
G.H.
grace_hopper
11 letters
\`\`\``,
      starter: 'first = "Grace"\nlast = "HOPPER"\n\n# Your code here\n',
      solution: 'first = "Grace"\nlast = "HOPPER"\n\ninitials = first[0].upper() + "." + last[0].upper() + "."\nusername = first.lower() + "_" + last.lower()\nletters = len(first) + len(last)\n\nprint(initials)\nprint(username)\nprint(f"{letters} letters")\n',
      solutionExplain: 'Index `[0]` grabs each first letter and `.upper()` capitalizes it. `.lower()` normalizes both names before joining with "_". `len` of each name added together counts the letters.',
      hints: [
        'Break it into three variables: `initials`, `username` and `letters`. Use `[0]`, `.upper()`, `.lower()` and `len()`.',
        '`initials = first[0].upper() + "." + last[0].upper() + "."` and `username = first.lower() + "_" + last.lower()`.',
      ],
      tests: [
        out('Grace Hopper', 'G.H.\ngrace_hopper\n11 letters', 'Check the dots in the initials, the underscore, and that everything in the username is lowercase.'),
        check(
          'Works for "alan" "Turing"',
          `got = RUN(CODE.replace('"Grace"', '"alan"').replace('"HOPPER"', '"Turing"')).strip()
assert got == 'A.T.\\nalan_turing\\n10 letters', 'Got: ' + got`,
          'With first="alan" and last="Turing" you should print A.T., alan_turing and 10 letters. Use the variables, not typed text.',
        ),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'word = "quest"\nprint(word[1])',
      answers: ['u'],
      explain: 'Indexes start at 0: q is 0, u is 1.',
      concept: 'indexing',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'name = "Bo"\nprint(f"{name} has {len(name)} letters")',
      answers: ['Bo has 2 letters'],
      explain: 'The f-string fills `{name}` with Bo and `{len(name)}` with 2.',
      concept: 'fstrings',
    },
    {
      kind: 'bug',
      prompt: 'This should print `Hello, Mia`, but prints `Hello, {name}`. Why?',
      code: 'name = "Mia"\nprint("Hello, {name}")',
      options: ['`name` is misspelled', 'The `f` before the string is missing', 'Curly braces should be round brackets', 'You can\'t use commas in strings'],
      answer: 1,
      explain: 'Without the `f` prefix, `{name}` is just ordinary text. Write `f"Hello, {name}"`.',
      concept: 'fstrings',
    },
    {
      kind: 'concept',
      prompt: 'After `s = "abc"` and `t = s.upper()`, what is `s`?',
      options: ['"ABC"', '"abc"', '"Abc"', 'An error'],
      answer: 1,
      explain: 'String methods return a NEW string. `s` is unchanged; `t` holds "ABC".',
      concept: 'string-methods',
    },
  ],
});
