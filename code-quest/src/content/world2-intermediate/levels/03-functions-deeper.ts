import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w2.l3',
  title: 'Functions, Deeper',
  icon: '🎛️',
  summary: 'Default values, keyword arguments, returning several values',
  lang: 'python',
  teaches: ['parameters', 'multiple-returns'],
  requires: ['functions', 'return', 'math', 'if-else'],
  learn: [
    {
      title: 'Defaults and keyword arguments',
      minutes: 3,
      analogy: 'Ordering coffee: if you don\'t say a size, you get a **medium** (the default). You can also name what you want — "size: large" — in any order.',
      body: `A parameter can have a **default value**, used when the caller leaves it out:

\`\`\`python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Ada")            # 'Hello, Ada!'
greet("Ada", "Hi")      # 'Hi, Ada!'
\`\`\`

Parameters with defaults must come **after** those without.

You can pass arguments **by name**. These are **keyword arguments**, and they make calls easier to read:

\`\`\`python
greet(greeting="Welcome", name="Alan")
\`\`\`

You've already met one: \`print("a", "b", sep="-")\` prints \`a-b\`.`,
      example: { lang: 'python', code: code`
        def greet(name, greeting="Hello", punctuation="!"):
            return f"{greeting}, {name}{punctuation}"

        print(greet("Ada"))
        print(greet("Ada", "Hi"))
        print(greet("Alan", punctuation="?"))
        print(greet(greeting="Welcome", name="Grace"))
      ` },
    },
    {
      title: 'Returning several values',
      minutes: 2,
      analogy: 'A function can hand you a **bundle** — like a bag with two items — and you can unpack both items in one go.',
      body: `Return several values by separating them with commas:

\`\`\`python
def min_max(nums):
    return min(nums), max(nums)
\`\`\`

This actually returns a **tuple** — like a list in round brackets, \`(1, 9)\`, that can't be changed. You can **unpack** it into separate variables in one line:

\`\`\`python
low, high = min_max([4, 1, 9])
print(low, high)   # 1 9
\`\`\`

The number of variables on the left must match the number of values returned.`,
      example: { lang: 'python', code: code`
        def min_max(nums):
            return min(nums), max(nums)

        result = min_max([4, 1, 9])
        print(result)
        low, high = min_max([4, 1, 9])
        print("low:", low, "high:", high)
      ` },
    },
  ],
  practice: [
    {
      title: 'power(base, exp=2)',
      minutes: 2,
      prompt: 'Write `power(base, exp=2)` that returns base to the power exp. With one argument it squares: `power(5)` → `25`; `power(2, 10)` → `1024`.',
      starter: 'def power(base, exp):\n    return base ** exp\n',
      solution: 'def power(base, exp=2):\n    return base ** exp\n',
      solutionExplain: 'Giving `exp` a default of 2 means callers can leave it out.',
      hints: ['Give `exp` a default value in the `def` line.', '`def power(base, exp=2):`'],
      tests: [
        call('power', [5], 25, 'With no exp, it should square.'),
        call('power', [2, 10], 1024, 'With exp given, use it.'),
        call('power', [3, 3], 27, '3 ** 3 = 27.'),
      ],
    },
    {
      title: 'min_max without builtins',
      minutes: 3,
      prompt: 'Write `min_max(nums)` that returns **two values**: the smallest and largest number. Use a loop (no `min()`/`max()`). `min_max([4, 1, 9])` → `(1, 9)`.',
      starter: 'def min_max(nums):\n    pass\n',
      solution: 'def min_max(nums):\n    low = nums[0]\n    high = nums[0]\n    for n in nums:\n        if n < low:\n            low = n\n        if n > high:\n            high = n\n    return low, high\n',
      solutionExplain: 'Track both extremes in one loop, then `return low, high` sends them back as a tuple.',
      hints: ['Start `low` and `high` at `nums[0]`, update both in one loop.', 'Finish with `return low, high`.'],
      tests: [
        call('min_max', [[4, 1, 9]], [1, 9], 'Smallest 1, largest 9.'),
        call('min_max', [[-3, -8, -1]], [-8, -1], 'Works with negatives.'),
        call('min_max', [[5]], [5, 5], 'One number is both min and max.'),
        check('No min()/max()', "assert 'min(' not in CODE and 'max(' not in CODE.replace('def min_max(', '')", 'Use a loop rather than min()/max().'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Unit converter kit',
      minutes: 5,
      prompt: `Build two converter functions:

**1. \`convert_temp(value, to="F")\`**
- \`to="F"\`: treat value as Celsius → Fahrenheit: \`value * 9 / 5 + 32\`
- \`to="C"\`: treat value as Fahrenheit → Celsius: \`(value - 32) * 5 / 9\`
- Round the result to 1 decimal place.

**2. \`split_time(total_seconds)\`** returns **three** values: hours, minutes, seconds.
\`split_time(3725)\` → \`(1, 2, 5)\` (1 h, 2 min, 5 s).`,
      starter: 'def convert_temp(value, to="F"):\n    pass\n\n\ndef split_time(total_seconds):\n    pass\n',
      solution: 'def convert_temp(value, to="F"):\n    if to == "F":\n        result = value * 9 / 5 + 32\n    else:\n        result = (value - 32) * 5 / 9\n    return round(result, 1)\n\n\ndef split_time(total_seconds):\n    hours = total_seconds // 3600\n    minutes = total_seconds % 3600 // 60\n    seconds = total_seconds % 60\n    return hours, minutes, seconds\n',
      solutionExplain: '`convert_temp` branches on the `to` parameter (default "F"). `split_time` uses `//` and `%`: 3600 seconds per hour, then the leftover seconds split into minutes and seconds, returned as a tuple.',
      hints: [
        'In `convert_temp`, use `if to == "F":` to pick the formula. In `split_time`, there are 3600 seconds in an hour; use `//` and `%`.',
        '`minutes = total_seconds % 3600 // 60` (the leftover after hours, in whole minutes). Return `hours, minutes, seconds`.',
      ],
      tests: [
        call('convert_temp', [100], 212.0, '100 °C is 212 °F (to defaults to "F").'),
        call('convert_temp', [0], 32.0, '0 °C is 32 °F.'),
        call('convert_temp', [212, 'C'], 100.0, 'With to="C", 212 °F is 100 °C.'),
        call('convert_temp', [37.5], 99.5, 'Round to 1 decimal place.'),
        check('Works with a keyword argument', "assert convert_temp(50, to='C') == 10.0", 'convert_temp(50, to="C") should be 10.0.'),
        call('split_time', [3725], [1, 2, 5], '3725 s = 1 h, 2 min, 5 s.'),
        call('split_time', [59], [0, 0, 59], 'Under a minute: 0, 0, 59.'),
        call('split_time', [7200], [2, 0, 0], 'Exactly 2 hours.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'def tag(text, wrap="*"):\n    return wrap + text + wrap\n\nprint(tag("hi"), tag("hi", "_"))',
      answers: ['*hi* _hi_'],
      explain: 'The first call uses the default "*"; the second overrides it with "_".',
    },
    {
      kind: 'bug',
      prompt: 'Why is this a SyntaxError?',
      code: 'def order(size="medium", drink):\n    return f"{size} {drink}"',
      options: ['Defaults aren\'t allowed', 'A parameter without a default can\'t come after one with a default', 'f-strings don\'t work in functions', '`drink` is a reserved word'],
      answer: 1,
      explain: 'Put parameters with defaults last: `def order(drink, size="medium"):`.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'def stats(a, b):\n    return a + b, a * b\n\ns, p = stats(3, 4)\nprint(p)',
      answers: ['12'],
      explain: 'The function returns (7, 12); unpacking puts 7 in `s` and 12 in `p`.',
      concept: 'multiple-returns',
    },
  ],
});
