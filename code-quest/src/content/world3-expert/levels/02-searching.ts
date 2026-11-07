import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w3.l2',
  title: 'Searching',
  icon: '🔍',
  summary: 'Linear search vs binary search (O(n) vs O(log n))',
  lang: 'python',
  teaches: ['searching'],
  requires: ['big-o', 'while-loop', 'lists', 'js-functions', 'js-control'],
  learn: [
    {
      title: 'Linear search',
      minutes: 2,
      analogy: 'Looking for your keys by checking **every pocket, one at a time**. Simple, works anywhere, but slow if you have a hundred pockets.',
      body: `**Linear search** checks each item in order until it finds the target. It works on any list, sorted or not, and is **O(n)**.

\`\`\`python
def linear_search(items, target):
    for i in range(len(items)):
        if items[i] == target:
            return i       # found: return the position
    return -1              # not found
\`\`\`

Returning \`-1\` for "not found" is a common convention, because \`-1\` can never be a real position.

\`enumerate(items)\` gives position **and** item together: \`for i, item in enumerate(items):\` — tidier than \`range(len(...))\`.`,
      example: {
        lang: 'python',
        code: code`
          def linear_search(items, target):
              for i, item in enumerate(items):
                  if item == target:
                      return i
              return -1

          names = ["Zoe", "Ada", "Max"]
          print(linear_search(names, "Ada"), linear_search(names, "Bob"))
        `,
      },
    },
    {
      title: 'Binary search',
      minutes: 3,
      analogy: 'The **number guessing game** from World 1, played perfectly: always guess the middle, and each "too high/too low" throws away half the possibilities.',
      body: `If a list is **sorted**, you can do much better. **Binary search**:

1. Look at the **middle** item.
2. If it's the target, done. If the target is smaller, search the **left half**; if bigger, the **right half**.
3. Repeat until found, or until there's nothing left.

Each step halves the search area, so 1,000,000 items take only about **20** steps. That's **O(log n)**.

Track the search area with two positions, \`low\` and \`high\`:

\`\`\`python
mid = (low + high) // 2
\`\`\`

It only works on **sorted** data — on an unsorted list it gives wrong answers.`,
      example: {
        lang: 'python',
        code: code`
          nums = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
          target = 23
          low, high = 0, len(nums) - 1
          while low <= high:
              mid = (low + high) // 2
              print(f"checking position {mid}: {nums[mid]}")
              if nums[mid] == target:
                  print("found at", mid)
                  break
              elif nums[mid] < target:
                  low = mid + 1
              else:
                  high = mid - 1
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Linear search',
      minutes: 2,
      prompt: 'Write `linear_search(items, target)` returning the index of the first match, or `-1`.',
      starter: 'def linear_search(items, target):\n    pass\n',
      solution: 'def linear_search(items, target):\n    for i, item in enumerate(items):\n        if item == target:\n            return i\n    return -1\n',
      solutionExplain: 'Check each item in order; return the position as soon as it matches; `-1` after the loop means "not found".',
      hints: ['Loop with `enumerate` to get both index and item.', 'Return `i` on a match; `return -1` after the loop.'],
      tests: [
        call('linear_search', [['a', 'b', 'c'], 'c'], 2, '"c" is at index 2.'),
        call('linear_search', [[5, 3, 5], 5], 0, 'Return the FIRST match.'),
        call('linear_search', [[1, 2], 9], -1, 'Not found → -1.'),
        check('No .index()', "assert '.index(' not in CODE", 'Write the loop yourself.'),
      ],
    },
    {
      title: 'How many halvings?',
      minutes: 2,
      prompt: 'Write `halvings(n)` returning how many times you can halve `n` (with `//= 2`) before it reaches 1. `halvings(8)` → `3` (8→4→2→1). This is roughly how many steps binary search needs.',
      starter: 'def halvings(n):\n    pass\n',
      solution: 'def halvings(n):\n    steps = 0\n    while n > 1:\n        n //= 2\n        steps += 1\n    return steps\n',
      solutionExplain: 'Count loop rounds until n reaches 1. For a million it\'s only 19 — that\'s why O(log n) is so fast.',
      hints: ['Use a while loop that runs while n > 1.', 'Inside: `n //= 2` and `steps += 1`.'],
      tests: [call('halvings', [8], 3, '8→4→2→1'), call('halvings', [1], 0, 'Already 1'), call('halvings', [1000000], 19, 'A million needs only 19 halvings!')],
    },
  ],
  challenges: [
    {
      title: 'Binary search (Python)',
      minutes: 6,
      prompt: `Write \`binary_search(sorted_items, target)\` returning the index of \`target\` or \`-1\`. Use the \`low\`/\`high\`/\`mid\` approach — **no** \`in\`, \`.index()\` or loops over every item.

The hidden tests search a list of 1,000,000 numbers 2,000 times; a linear search would run out of time.`,
      starter: 'def binary_search(sorted_items, target):\n    low = 0\n    high = len(sorted_items) - 1\n    # your loop here\n    return -1\n',
      solution: 'def binary_search(sorted_items, target):\n    low = 0\n    high = len(sorted_items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if sorted_items[mid] == target:\n            return mid\n        elif sorted_items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n',
      solutionExplain: 'Each round compares the middle item and discards half the remaining range by moving `low` or `high` past `mid`. When `low` passes `high`, the range is empty — not found.',
      hints: [
        'Loop `while low <= high:`. Compute `mid = (low + high) // 2` and compare `sorted_items[mid]` with the target.',
        'If the middle is too small, `low = mid + 1`; too big, `high = mid - 1`. The `+ 1` / `- 1` matter — without them the loop can get stuck.',
      ],
      tests: [
        call('binary_search', [[2, 5, 8, 12, 16, 23, 38], 23], 5, '23 is at index 5.'),
        call('binary_search', [[2, 5, 8, 12, 16, 23, 38], 2], 0, 'First item.'),
        call('binary_search', [[2, 5, 8, 12, 16, 23, 38], 38], 6, 'Last item.'),
        call('binary_search', [[2, 5, 8], 7], -1, 'Missing → -1.'),
        call('binary_search', [[], 1], -1, 'Empty list → -1.'),
        check('Fast on a million items', "big = list(range(0, 2000000, 2))\nfor t in range(0, 2000000, 1000):\n    assert binary_search(big, t) == t // 2\nassert binary_search(big, 7) == -1", '2,000 searches on a million items must be fast — O(log n).'),
      ],
    },
    {
      title: 'Binary search (JavaScript port)',
      lang: 'javascript',
      minutes: 4,
      prompt: 'Port your binary search to JavaScript as `binarySearch(sortedItems, target)`. JS has no `//` operator: use `Math.floor((low + high) / 2)`.',
      starter: 'function binarySearch(sortedItems, target) {\n}\n',
      solution: 'function binarySearch(sortedItems, target) {\n  let low = 0;\n  let high = sortedItems.length - 1;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    if (sortedItems[mid] === target) return mid;\n    if (sortedItems[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}\n',
      solutionExplain: 'Same algorithm; `Math.floor` rounds down the way `//` does. Algorithms are ideas — they transfer between languages.',
      hints: ['`let low = 0; let high = sortedItems.length - 1; while (low <= high) { ... }`', '`const mid = Math.floor((low + high) / 2);` then the same three-way comparison.'],
      tests: [
        call('binarySearch', [[2, 5, 8, 12, 16, 23, 38], 23], 5, '23 is at index 5.'),
        call('binarySearch', [[2, 5, 8], 7], -1, 'Missing → -1.'),
        call('binarySearch', [[], 3], -1, 'Empty → -1.'),
        call('binarySearch', [[1, 3, 5, 7, 9, 11], 1], 0, 'First item.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'concept',
      prompt: 'What must be true for binary search to work?',
      options: ['The list has no duplicates', 'The list is sorted', 'The list is short', 'The items are strings'],
      answer: 1,
      explain: 'Throwing away half only makes sense if everything on one side is smaller.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'Binary search on [10, 20, 30, 40, 50, 60, 70] for 60. Which value is checked FIRST? (Just the number.)',
      code: 'low, high = 0, 6\nmid = (low + high) // 2',
      answers: ['40'],
      explain: 'mid = (0 + 6) // 2 = 3, and the item at index 3 is 40.',
    },
    {
      kind: 'bug',
      prompt: 'This binary search sometimes loops forever. Why?',
      code: 'while low <= high:\n    mid = (low + high) // 2\n    if items[mid] < target:\n        low = mid\n    elif items[mid] > target:\n        high = mid\n    else:\n        return mid',
      options: ['mid should use /', '`low = mid` and `high = mid` don\'t shrink the range when low == mid; use mid + 1 / mid - 1', 'Should be `while low < high`', 'Missing return -1 inside the loop'],
      answer: 1,
      explain: 'Without the ±1, the range can stop shrinking and the loop never ends.',
    },
  ],
});
