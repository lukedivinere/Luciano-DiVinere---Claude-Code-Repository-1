import { check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w1.l2',
  title: 'Variables & Types',
  icon: '📦',
  summary: 'Store values in named boxes; meet int, float, str and bool',
  lang: 'python',
  teaches: ['variables', 'types'],
  requires: ['print'],
  learn: [
    {
      title: 'Variables: labeled boxes',
      minutes: 2,
      analogy: 'A **variable** is a labeled box. You put a value inside and write a name on the label, so you can find it later.',
      body: `A **variable** is a name that refers to a value. You create one with \`=\`, called the **assignment operator**:

\`\`\`python
score = 10
\`\`\`

Read it as "store 10 in a box labeled score". It does **not** mean "equals" like in math.

- Use the name (no quotes!) to get the value back: \`print(score)\`.
- Assign again to **replace** the value: \`score = 25\`.
- Names can use letters, digits and \`_\`, but can't start with a digit. Use lowercase_with_underscores, like \`high_score\`.

\`print\` can show several things at once — separate them with commas and Python puts a space between them:
\`print("Score:", score)\` shows \`Score: 25\`.`,
      example: { lang: 'python', code: code`
        player = "Ada"
        score = 10
        print(player, "has", score, "points")

        score = 25          # replace the value
        print("Now:", score)
      ` },
    },
    {
      title: 'Data types',
      minutes: 2,
      analogy: 'Values come in different **shapes**, like different kinds of containers: a number jar, a word box, a yes/no light switch.',
      body: `Every value has a **type**, which decides what you can do with it. The four basic types:

| Type | Name | Examples |
|---|---|---|
| \`int\` | **integer** (whole number) | \`7\`, \`-3\`, \`0\` |
| \`float\` | number with a decimal point | \`3.14\`, \`2.0\` |
| \`str\` | **string** (text) | \`"hi"\`, \`'42'\` |
| \`bool\` | **boolean** (true/false) | \`True\`, \`False\` |

\`type(x)\` tells you the type of \`x\`.

Watch out: \`"42"\` (with quotes) is text, not a number! And \`True\`/\`False\` need a capital letter.`,
      example: { lang: 'python', code: code`
        print(type(7))
        print(type(3.5))
        print(type("hello"))
        print(type(True))
        print(type("42"))   # quotes make it text!
      ` },
    },
  ],
  practice: [
    {
      title: 'Pet facts',
      minutes: 2,
      prompt: `Create a variable \`pet\` that holds the text \`"cat"\` and a variable \`legs\` that holds the number \`4\`.

Then print them on one line, so the output is:

\`\`\`
cat 4
\`\`\``,
      starter: '# Create pet and legs, then print them\n',
      solution: 'pet = "cat"\nlegs = 4\nprint(pet, legs)\n',
      solutionExplain: 'Two assignments create the boxes; `print(pet, legs)` shows both, with a space between.',
      hints: ['Create each variable with `=`. Text needs quotes, numbers don\'t.', 'Write `pet = "cat"`, then `legs = 4`, then `print(pet, legs)`.'],
      tests: [
        out('Prints "cat 4"', 'cat 4', 'Print both variables in one print, separated by a comma.'),
        check('pet is the text "cat"', "assert pet == 'cat'", 'Make a variable named exactly `pet` holding the string "cat".'),
        check('legs is the number 4', "assert legs == 4 and type(legs) == int, 'legs should be the int 4 (no quotes)'", 'Make `legs` hold the whole number 4 — no quotes, or it becomes text.'),
      ],
    },
    {
      title: 'Swap the boxes',
      minutes: 2,
      prompt: `\`a\` holds \`"left"\` and \`b\` holds \`"right"\`. Swap them so the last line prints \`right left\`.

**Don't** retype the words — use a third variable (e.g. \`temp\`) to hold one value while you move things around, just like you'd need an empty glass to swap the drinks in two glasses.`,
      starter: 'a = "left"\nb = "right"\n\n# Swap a and b here\n\nprint(a, b)\n',
      solution: 'a = "left"\nb = "right"\n\ntemp = a\na = b\nb = temp\n\nprint(a, b)\n',
      solutionExplain: '`temp` saves the old `a`. Then `a` gets `b`\'s value, and `b` gets the saved value from `temp`.',
      hints: ['If you write `a = b` first, the word "left" is lost. Save it somewhere first.', '`temp = a`, then `a = b`, then `b = temp`.'],
      tests: [
        out('Prints "right left"', 'right left', 'After swapping, a should hold "right" and b should hold "left".'),
        check('Words are not retyped', "assert CODE.count('\"left\"') + CODE.count(\"'left'\") == 1, 'You typed \"left\" again'", 'Swap using variables — the words "left" and "right" should only appear in the first two lines.'),
      ],
    },
    {
      title: 'One of each type',
      minutes: 2,
      prompt: `Create four variables:

- \`count\` — the **int** \`10\`
- \`price\` — the **float** \`2.5\`
- \`title\` — the **str** \`"Quest"\`
- \`is_fun\` — the **bool** \`True\`

Then print the type of \`price\` using \`type()\`.`,
      starter: '# Create the four variables\n\n\n# Print the type of price\n',
      solution: 'count = 10\nprice = 2.5\ntitle = "Quest"\nis_fun = True\n\nprint(type(price))\n',
      solutionExplain: 'Each value\'s shape decides its type: `10` → int, `2.5` → float, `"Quest"` → str, `True` → bool.',
      hints: ['Numbers without a dot are ints; with a dot they are floats. `True` has a capital T and no quotes.', '`count = 10`, `price = 2.5`, `title = "Quest"`, `is_fun = True`, then `print(type(price))`.'],
      tests: [
        check('count is an int', "assert type(count) == int and count == 10", '`count` must be the whole number 10, no quotes.'),
        check('price is a float', "assert type(price) == float and price == 2.5", '`price` must be 2.5 (a float).'),
        check('title is a str', "assert title == 'Quest'", '`title` must be the text "Quest" in quotes.'),
        check('is_fun is a bool', "assert is_fun is True", '`is_fun` must be True — capital T, no quotes.'),
        out('Prints the type of price', "<class 'float'>", "Finish with `print(type(price))`."),
      ],
    },
  ],
  challenges: [
    {
      title: 'Profile card',
      minutes: 4,
      prompt: `The starter code stores facts about a person in variables. Print a profile card using **the variables** (not retyped values):

\`\`\`
Name: Ada
Age: 36
Height: 1.65
Likes Python: True
\`\`\`

The hidden tests also change the values at the top and check your card updates, so don't type "Ada" or 36 anywhere else.`,
      starter: 'name = "Ada"\nage = 36\nheight = 1.65\nlikes_python = True\n\n# Print the profile card below\n',
      solution: 'name = "Ada"\nage = 36\nheight = 1.65\nlikes_python = True\n\nprint("Name:", name)\nprint("Age:", age)\nprint("Height:", height)\nprint("Likes Python:", likes_python)\n',
      solutionExplain: 'Each `print` combines a label (a string) with a variable, separated by a comma. Because the variables are used, changing the values at the top changes the card.',
      hints: ['`print` can take a label and a variable: `print("Name:", name)`.', 'Write four prints: one for each of name, age, height and likes_python, each with its label.'],
      tests: [
        out('Prints the card', 'Name: Ada\nAge: 36\nHeight: 1.65\nLikes Python: True', 'Check each label (with its colon) and that each line uses the right variable.'),
        check(
          'Uses the variables (values changed)',
          `src = CODE.replace('"Ada"', '"Linus"').replace('36', '54').replace('1.65', '1.8').replace('True', 'False')
assert RUN(src) .strip() == 'Name: Linus\\nAge: 54\\nHeight: 1.8\\nLikes Python: False', 'Card did not change when the variables changed'`,
          'When the values at the top change, your card should change too. Print the variables, not typed-out values.',
        ),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'x = 5\nx = 8\nprint(x)',
      answers: ['8'],
      explain: 'The second assignment replaces the value in the box, so `x` is 8.',
      concept: 'variables',
    },
    {
      kind: 'concept',
      prompt: 'What is the type of `"3.5"`?',
      options: ['float', 'int', 'str', 'bool'],
      answer: 2,
      explain: 'It has quotes around it, so it is a string (text), even though it looks like a number.',
      concept: 'types',
    },
    {
      kind: 'bug',
      prompt: 'This should print `Hello Sam`. What is wrong?',
      code: 'name = "Sam"\nprint("Hello", "name")',
      options: ['`name` should be in quotes on line 1', 'The variable is in quotes on line 2, so it prints the word name', 'print can\'t take two values', 'Nothing is wrong'],
      answer: 1,
      explain: '`"name"` in quotes is just the text "name". To use the variable, write `name` without quotes: `print("Hello", name)`.',
      concept: 'variables',
    },
    {
      kind: 'concept',
      prompt: 'Which is a valid variable name?',
      options: ['`2nd_place`', '`high score`', '`high_score`', '`"score"`'],
      answer: 2,
      explain: 'Names can\'t start with a digit or contain spaces, and quotes make text, not a name. `high_score` is perfect.',
      concept: 'variables',
    },
  ],
});
