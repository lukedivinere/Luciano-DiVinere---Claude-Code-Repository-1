import { check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w1.l1',
  title: 'Hello, Code',
  icon: '👋',
  summary: 'What code is, and your first print()',
  lang: 'python',
  teaches: ['what-is-code', 'print', 'comments'],
  requires: [],
  learn: [
    {
      title: 'What is code?',
      minutes: 2,
      analogy: 'Code is a **recipe** for a very literal chef. The computer follows every step exactly, in order, and never guesses what you meant.',
      body: `**Code** is a list of instructions written for a computer. A **program** is a set of those instructions that does a job.

You write code in a **programming language** — a language with strict rules that both you and the computer can read. We'll start with **Python**, a language known for being clear and readable.

Python runs your code **top to bottom, one line at a time**.

Your first instruction is \`print(...)\`. It shows a message on the screen. The message goes inside the brackets, wrapped in quotes. Text inside quotes is called a **string**.

Press **▶ Run** on the right and watch the output appear.`,
      example: { lang: 'python', code: code`
        print("Hello, world!")
        print("I am learning to code.")
      ` },
    },
    {
      title: 'print() and comments',
      minutes: 2,
      analogy: 'A **comment** is a sticky note on the recipe. The chef ignores it, but it helps humans understand the steps.',
      body: `A few rules about \`print\`:

- Each \`print\` puts its message on a **new line**.
- Quotes can be "double" or 'single' — they just have to match.
- \`print()\` with nothing inside prints an empty line.
- \`print\` can show numbers too, without quotes: \`print(42)\`.

A **comment** starts with \`#\`. Python ignores everything after \`#\` on that line, so comments are notes for people.

Spelling and capitals matter: \`Print\` (capital P) is an error. Try it in the example to see what an error message looks like — you'll get a plain-English explanation.`,
      example: { lang: 'python', code: code`
        # This line is a comment. Python skips it.
        print('Single quotes work too')
        print()          # an empty line
        print(42)        # numbers don't need quotes
        print("Bye!")
      ` },
    },
  ],
  practice: [
    {
      title: 'Say your name',
      minutes: 1,
      prompt: `Make the program print exactly:

\`\`\`
Hello, my name is Robo
\`\`\``,
      starter: '# Write your print() below\n',
      solution: 'print("Hello, my name is Robo")\n',
      solutionExplain: 'One `print` with the whole sentence as a string inside the brackets.',
      hints: ['Use `print(...)` with the sentence inside quotes.', 'It looks like: `print("Hello, my name is ...")` — capital H, comma after Hello.'],
      tests: [out('Prints the greeting', 'Hello, my name is Robo', 'Your output must match exactly, including capitals, the comma and spaces.')],
    },
    {
      title: 'Three lines',
      minutes: 2,
      prompt: `Print these three lines, in this order. Each needs its own \`print\`:

\`\`\`
Ready
Set
Go!
\`\`\``,
      starter: 'print("Ready")\n',
      solution: 'print("Ready")\nprint("Set")\nprint("Go!")\n',
      solutionExplain: 'Python runs top to bottom, so three `print` lines produce three output lines in that order.',
      hints: ['One line is already done. Add two more `print` lines below it.', 'Add `print("Set")` and then `print("Go!")`.'],
      tests: [out('Prints Ready / Set / Go!', 'Ready\nSet\nGo!', 'You need three lines of output, in the order Ready, Set, Go!')],
    },
    {
      title: 'Fix the missing quote',
      type: 'debug',
      minutes: 1,
      prompt: `🐞 **Debug Mode:** this code is broken. Press **▶ Run** to see the error, read the explanation, then fix it so it prints:

\`\`\`
Coding is fun
\`\`\``,
      starter: 'print("Coding is fun)\n',
      solution: 'print("Coding is fun")\n',
      solutionExplain: 'The string started with `"` but never ended. Adding the closing `"` before `)` fixes it.',
      hints: ['Count the quote marks. Strings need an opening AND a closing quote.', 'Add a `"` right after the word `fun`.'],
      tests: [out('Prints the message', 'Coding is fun', 'The program should print "Coding is fun" without an error.')],
    },
  ],
  challenges: [
    {
      title: 'Your coder badge',
      minutes: 3,
      prompt: `Print this 3-line badge **exactly** (spaces and symbols count!):

\`\`\`
+-----------+
| CODE QUEST |
+-----------+
\`\`\`

Also add at least one **comment** (a line starting with \`#\`) explaining what your program does.`,
      starter: '# Print the badge here\n',
      solution: '# Prints my Code Quest badge\nprint("+-----------+")\nprint("| CODE QUEST |")\nprint("+-----------+")\n',
      solutionExplain: 'Three `print` calls, one per line. The comment is ignored by Python but explains the code to humans.',
      hints: [
        'Use one `print` per line. Copy each line of the badge into quotes.',
        'The first and last lines are the same: `print("+-----------+")`. The middle is `print("| CODE QUEST |")`.',
      ],
      tests: [
        out('Badge is printed exactly', '+-----------+\n| CODE QUEST |\n+-----------+', 'Compare your output character by character with the badge — count the dashes (11) and the spaces next to the | bars.'),
        check('Has a comment', "assert any(l.strip().startswith('#') for l in CODE.splitlines()), 'No comment found'", 'Add at least one comment line that starts with `#`.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'concept',
      prompt: 'What is a **program**?',
      options: ['A list of instructions the computer follows in order', 'A website', 'A type of computer', 'A file that only stores pictures'],
      answer: 0,
      explain: 'A program is a set of instructions. The computer follows them exactly, top to bottom.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'print("A")\n# print("B")\nprint("C")',
      answers: ['A\nC'],
      explain: 'The middle line is a comment (it starts with `#`), so Python skips it. Only A and C print.',
      concept: 'comments',
    },
    {
      kind: 'bug',
      prompt: 'Which line has a bug?',
      code: '1  print("Hi")\n2  Print("there")\n3  print("friend")',
      options: ['Line 1', 'Line 2', 'Line 3', 'No bug'],
      answer: 1,
      explain: 'Python is case-sensitive: `Print` with a capital P is not the same as `print`. Line 2 causes a NameError.',
      concept: 'print',
    },
    {
      kind: 'concept',
      prompt: 'What does `print()` with nothing inside the brackets do?',
      options: ['Causes an error', 'Prints an empty line', 'Prints the word print', 'Nothing at all'],
      answer: 1,
      explain: '`print()` prints an empty line — handy for spacing out output.',
      concept: 'print',
    },
  ],
});
