import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w3.l4',
  title: 'Recursion',
  icon: '🪞',
  summary: 'Functions that call themselves: base case + smaller step',
  lang: 'python',
  teaches: ['recursion'],
  requires: ['functions', 'return', 'lists', 'dicts', 'nested-data', 'sorting'],
  learn: [
    {
      title: 'A function that calls itself',
      minutes: 3,
      analogy: '**Russian nesting dolls**: to find the smallest doll, open the doll in front of you — and do the same thing to the doll inside — until a doll won\'t open. That last one is the **base case**.',
      body: `A **recursive** function calls **itself** to solve a smaller version of the same problem. Every recursive function needs:

1. A **base case**: a simple input answered directly, with no further call.
2. A **recursive step**: call itself on a **smaller** input, and build the answer from that result.

\`\`\`python
def factorial(n):
    if n <= 1:          # base case
        return 1
    return n * factorial(n - 1)   # smaller problem
\`\`\`

\`factorial(4)\` = 4 × factorial(3) = 4 × 3 × factorial(2) = 4 × 3 × 2 × 1 = 24.

Forget the base case (or never get closer to it) and you get a **RecursionError** — infinite calls.`,
      example: {
        lang: 'python',
        code: code`
          def factorial(n):
              print("  " * (5 - n) + f"factorial({n}) called")
              if n <= 1:
                  return 1
              result = n * factorial(n - 1)
              print("  " * (5 - n) + f"factorial({n}) returns {result}")
              return result

          print(factorial(4))
        `,
      },
    },
    {
      title: 'When recursion shines',
      minutes: 2,
      analogy: 'Exploring folders on your computer: a folder can contain files **and other folders**, which can contain more folders… Recursion handles "any depth" naturally.',
      body: `Anything a loop does, recursion can too — and loops are usually simpler for flat lists. Recursion shines on **nested** structures of unknown depth: folders inside folders, lists inside lists, comments with replies to replies.

\`isinstance(x, list)\` checks whether x is a list (also \`dict\`, \`int\`…):

\`\`\`python
def count_items(data):
    total = 0
    for item in data:
        if isinstance(item, list):
            total += count_items(item)   # go deeper
        else:
            total += 1
    return total
\`\`\`

Here the base case is hidden: a list with no sub-lists makes no recursive calls.`,
      example: {
        lang: 'python',
        code: code`
          def count_items(data):
              total = 0
              for item in data:
                  if isinstance(item, list):
                      total += count_items(item)
                  else:
                      total += 1
              return total

          print(count_items([1, [2, 3], [4, [5, [6]]]]))
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Recursive factorial',
      minutes: 2,
      prompt: 'Write `factorial(n)` **recursively** (no loops). `factorial(5)` → `120`, `factorial(0)` → `1`.',
      starter: 'def factorial(n):\n    pass\n',
      solution: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n',
      solutionExplain: 'Base case: 0 and 1 give 1. Otherwise n times the factorial of one less.',
      hints: ['Base case: `if n <= 1: return 1`.', 'Recursive step: `return n * factorial(n - 1)`.'],
      tests: [call('factorial', [5], 120, '5! = 120'), call('factorial', [0], 1, '0! = 1'), check('No loops', "assert 'for ' not in CODE and 'while ' not in CODE", 'Use recursion, not a loop.')],
    },
    {
      title: 'Recursive sum',
      minutes: 2,
      prompt: 'Write `sum_list(nums)` recursively: the sum of an empty list is 0; otherwise it\'s the first item plus the sum of the rest (`nums[1:]`).',
      starter: 'def sum_list(nums):\n    pass\n',
      solution: 'def sum_list(nums):\n    if not nums:\n        return 0\n    return nums[0] + sum_list(nums[1:])\n',
      solutionExplain: 'Each call handles one item and passes a shorter list on, so it always reaches the empty-list base case.',
      hints: ['`if not nums: return 0` — an empty list counts as False.', '`return nums[0] + sum_list(nums[1:])`'],
      tests: [call('sum_list', [[1, 2, 3, 4]], 10, '1+2+3+4'), call('sum_list', [[]], 0, 'Empty → 0'), check('No loops or sum()', "assert 'for ' not in CODE and 'while ' not in CODE and 'sum(' not in CODE.replace('sum_list(', '')", 'Use recursion.')],
    },
  ],
  challenges: [
    {
      title: 'Flatten and nested sum',
      minutes: 7,
      prompt: `Two recursive functions for data of any depth:

**1. \`flatten(nested)\`** — turn nested lists into one flat list, keeping order:
\`flatten([1, [2, [3, 4]], 5])\` → \`[1, 2, 3, 4, 5]\`

**2. \`nested_sum(data)\`** — add up every number inside any mix of dicts and lists (dict **values** count, keys don't):

\`\`\`python
nested_sum({"a": 1, "b": [2, 3, {"c": 4}], "d": {"e": 5}})   # 15
\`\`\`

Numbers can be ints or floats; ignore strings.`,
      starter: 'def flatten(nested):\n    pass\n\n\ndef nested_sum(data):\n    pass\n',
      solution: 'def flatten(nested):\n    result = []\n    for item in nested:\n        if isinstance(item, list):\n            result.extend(flatten(item))\n        else:\n            result.append(item)\n    return result\n\n\ndef nested_sum(data):\n    if isinstance(data, dict):\n        return sum([nested_sum(v) for v in data.values()])\n    if isinstance(data, list):\n        return sum([nested_sum(v) for v in data])\n    if isinstance(data, (int, float)):\n        return data\n    return 0\n',
      solutionExplain: '`flatten` recurses into sub-lists and `extend`s the result (adds all items). `nested_sum` handles each shape: dicts and lists recurse on their contents; a number is the base case; anything else counts as 0.',
      hints: [
        '`flatten`: loop; if the item is a list, add all of `flatten(item)` (use `result.extend(...)`), otherwise append the item.',
        '`nested_sum`: check `isinstance(data, dict)` → sum of nested_sum of each value; list → same for each item; number → return it; otherwise 0.',
      ],
      tests: [
        call('flatten', [[1, [2, [3, 4]], 5]], [1, 2, 3, 4, 5], 'Flatten every level, keep order.'),
        call('flatten', [[[[[]]], 'a']], ['a'], 'Empty nested lists vanish.'),
        call('flatten', [[]], [], 'Empty → empty.'),
        call('nested_sum', [{ a: 1, b: [2, 3, { c: 4 }], d: { e: 5 } }], 15, '1+2+3+4+5'),
        call('nested_sum', [[1.5, 'skip', [2.5]]], 4.0, 'Floats count; strings are ignored.'),
        call('nested_sum', [{}], 0, 'Empty dict → 0'),
        check('Handles deep nesting', "deep = 1\nfor _ in range(200):\n    deep = [deep]\nassert flatten(deep) == [1] and nested_sum(deep) == 1", '200 levels deep should still work.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'def f(n):\n    if n == 0:\n        return ""\n    return str(n) + f(n - 1)\n\nprint(f(3))',
      answers: ['321'],
      explain: '"3" + f(2) = "3" + "2" + f(1) = "3" + "2" + "1" + "".',
    },
    {
      kind: 'bug',
      prompt: 'Why does this raise RecursionError for countdown(3)?',
      code: 'def countdown(n):\n    print(n)\n    countdown(n - 1)',
      options: ['print is not allowed in recursion', 'There is no base case, so it never stops', 'n - 1 should be n + 1', 'Functions can\'t call themselves'],
      answer: 1,
      explain: 'Add `if n == 0: return` before the recursive call.',
    },
    {
      kind: 'concept',
      prompt: 'Which problem suits recursion best?',
      options: ['Summing a flat list of numbers', 'Walking folders that contain folders to any depth', 'Printing 1 to 10', 'Reading one input'],
      answer: 1,
      explain: 'Nested structures of unknown depth are where recursion shines.',
    },
  ],
});
