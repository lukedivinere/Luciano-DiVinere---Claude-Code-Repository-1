import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w3.l1',
  title: 'Big-O in Plain English',
  icon: '📈',
  summary: 'How code slows down as data grows — and sets for speed',
  lang: 'python',
  teaches: ['big-o'],
  requires: ['for-loop', 'lists', 'dicts', 'functions', 'comprehensions'],
  learn: [
    {
      title: 'Counting steps, not seconds',
      minutes: 3,
      analogy: 'Finding a friend in a crowd: shouting their name is instant no matter the crowd size (**O(1)**); checking every face takes longer as the crowd grows (**O(n)**); asking every person about every other person is a nightmare (**O(n²)**).',
      body: `**Big-O notation** describes how the number of steps grows as the input size **n** grows. It ignores small details and asks: "if the data gets 10× bigger, how much slower is this?"

| Big-O | Name | Example | 10× data → |
|---|---|---|---|
| O(1) | constant | \`d[key]\`, \`nums[0]\` | same time |
| O(log n) | logarithmic | binary search (next level) | a tiny bit slower |
| O(n) | linear | one loop over a list | 10× slower |
| O(n²) | quadratic | a loop inside a loop | **100×** slower |

A loop inside a loop over the same list is the classic O(n²) trap. With 100,000 items that's 10 billion steps!`,
      example: {
        lang: 'python',
        code: code`
          def count_steps_linear(n):
              steps = 0
              for i in range(n):
                  steps += 1
              return steps

          def count_steps_quadratic(n):
              steps = 0
              for i in range(n):
                  for j in range(n):
                      steps += 1
              return steps

          for n in [10, 100, 1000]:
              print(n, count_steps_linear(n), count_steps_quadratic(n))
        `,
      },
    },
    {
      title: 'Sets: instant lookups',
      minutes: 3,
      analogy: 'Checking `x in my_list` is reading every page of a notebook; checking `x in my_set` is looking up a word in a book\'s **index** — straight to the answer.',
      body: `\`x in some_list\` is **O(n)**: Python checks items one by one. Inside a loop, that becomes O(n²).

A **set** is like a dict with only keys: an unordered collection of **unique** values with **O(1)** lookups.

\`\`\`python
seen = set()          # empty set (not {} — that's a dict!)
seen.add(5)
5 in seen             # True, instantly
set([1, 2, 2, 3])     # {1, 2, 3} — duplicates removed
len(set(nums))        # how many different values
\`\`\`

Dict key lookups are O(1) too. Swapping a list for a set or dict is the most common real-world speed-up.`,
      example: {
        lang: 'python',
        code: code`
          nums = [4, 2, 4, 7, 2]
          unique = set(nums)
          print(unique, len(unique))
          seen = set()
          for n in nums:
              if n in seen:
                  print("seen before:", n)
              seen.add(n)
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Count the unique values',
      minutes: 1,
      prompt: 'Write `unique_count(nums)` returning how many **different** values are in `nums`. One line with a set.',
      starter: 'def unique_count(nums):\n    pass\n',
      solution: 'def unique_count(nums):\n    return len(set(nums))\n',
      solutionExplain: 'A set keeps only one copy of each value, so its length is the number of distinct values.',
      hints: ['Turning a list into a set removes duplicates.', '`return len(set(nums))`'],
      tests: [call('unique_count', [[4, 2, 4, 7, 2]], 3, '4, 2, 7 → 3'), call('unique_count', [[]], 0, 'Empty → 0')],
    },
    {
      title: 'Fast membership',
      minutes: 3,
      prompt: `Write \`found(items, targets)\` returning the targets that appear in \`items\`, in the order of \`targets\`.

It must be fast for **100,000 items × 100,000 targets** — so convert \`items\` to a set first. (The hidden test times out after 3 seconds if you use \`in\` on the list.)`,
      starter: 'def found(items, targets):\n    return [t for t in targets if t in items]\n',
      solution: 'def found(items, targets):\n    lookup = set(items)\n    return [t for t in targets if t in lookup]\n',
      solutionExplain: 'Building the set is O(n) once; each lookup is then O(1), so the whole thing is O(n) instead of O(n²).',
      hints: ['The starter is correct but O(n²): `t in items` scans the whole list every time.', 'Make `lookup = set(items)` first and check `t in lookup`.'],
      tests: [
        call('found', [[1, 2, 3], [3, 9, 1]], [3, 1], 'Keep targets that exist, in target order.'),
        check('Fast with 100,000 items', "items = list(range(0, 200000, 2))\ntargets = list(range(100000))\nr = found(items, targets)\nassert len(r) == 50000", 'Must finish quickly with 100,000 items — use a set.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Duplicate detector, O(n)',
      minutes: 6,
      prompt: `This works but is **O(n²)** — it compares every pair:

\`\`\`python
def has_duplicates(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False
\`\`\`

Rewrite it in **O(n)** with a set, and add \`first_duplicate(nums)\` that returns the **first value that appears a second time** while reading left to right (or \`None\`).

\`first_duplicate([3, 1, 4, 1, 3])\` → \`1\` (the second 1 comes before the second 3).

Hidden tests use 200,000 numbers, so O(n²) will run out of time.`,
      starter: 'def has_duplicates(nums):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] == nums[j]:\n                return True\n    return False\n\n\ndef first_duplicate(nums):\n    pass\n',
      solution: 'def has_duplicates(nums):\n    return len(set(nums)) != len(nums)\n\n\ndef first_duplicate(nums):\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return n\n        seen.add(n)\n    return None\n',
      solutionExplain: 'If converting to a set shrinks the list, something was repeated — one O(n) pass. `first_duplicate` remembers what it has seen in a set; the first value already in the set is the answer.',
      hints: [
        'For `has_duplicates`: compare `len(set(nums))` with `len(nums)`. For `first_duplicate`: keep a `seen` set while you loop.',
        'In the loop: `if n in seen: return n`, otherwise `seen.add(n)`. After the loop `return None`.',
      ],
      tests: [
        call('has_duplicates', [[1, 2, 3, 2]], true, '2 appears twice.'),
        call('has_duplicates', [[1, 2, 3]], false, 'All different.'),
        call('first_duplicate', [[3, 1, 4, 1, 3]], 1, 'The second 1 appears before the second 3.'),
        call('first_duplicate', [[1, 2, 3]], null, 'No duplicates → None.'),
        check('has_duplicates is fast', "big = list(range(200000))\nassert has_duplicates(big) is False\nassert has_duplicates(big + [5]) is True", 'Must handle 200,000 numbers quickly — no nested loops.'),
        check('first_duplicate is fast', "big = list(range(200000)) + [199999]\nassert first_duplicate(big) == 199999", 'Must handle 200,000 numbers quickly.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'concept',
      prompt: 'A function loops once over a list of n items. If n grows 10×, roughly how much longer does it take?',
      options: ['The same', 'About 10×', 'About 100×', 'About 2×'],
      answer: 1,
      explain: 'One loop is O(n): time grows in proportion to n.',
    },
    {
      kind: 'bug',
      prompt: 'This is correct but very slow for big lists. What\'s the problem?',
      code: 'def common(a, b):\n    return [x for x in a if x in b]',
      options: ['Comprehensions are slow', '`x in b` scans list b each time → O(n²). Use `set(b)`', 'It should use a while loop', 'Nothing'],
      answer: 1,
      explain: 'Membership in a list is O(n). Convert b to a set once for O(1) lookups.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'print(len(set("banana")))',
      answers: ['3'],
      explain: 'The unique letters are b, a, n.',
    },
  ],
});
