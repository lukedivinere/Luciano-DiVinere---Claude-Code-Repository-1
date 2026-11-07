import { call, check, code, defineLevel } from '../../dsl';

const PLAYERS = [
  { name: 'Zed', score: 50 },
  { name: 'Ada', score: 90 },
  { name: 'Bo', score: 50 },
  { name: 'Cy', score: 90 },
];

export default defineLevel({
  id: 'w3.l3',
  title: 'Sorting',
  icon: '🗃️',
  summary: 'Bubble & insertion sort, and sorted(key=...)',
  lang: 'python',
  teaches: ['sorting'],
  requires: ['big-o', 'searching', 'lists', 'dicts', 'functions'],
  learn: [
    {
      title: 'How sorting works',
      minutes: 3,
      analogy: '**Insertion sort** is how most people sort a hand of cards: pick up one card at a time and slide it left until it sits in the right place.',
      body: `A **sorting algorithm** puts items in order. Two simple ones:

- **Bubble sort**: walk through the list swapping neighbors that are in the wrong order. Big values "bubble" to the end. Repeat until no swaps happen.
- **Insertion sort**: build a sorted section at the front. Take the next item and shift it left past every bigger item.

Both are **O(n²)** — fine for small lists, too slow for big ones. Python's built-in \`sorted()\` uses a cleverer algorithm (Timsort) that's **O(n log n)**.

Swapping two items in Python is one line:

\`\`\`python
nums[i], nums[i + 1] = nums[i + 1], nums[i]
\`\`\``,
      example: {
        lang: 'python',
        code: code`
          def insertion_sort(nums):
              result = nums[:]              # copy, don't change the original
              for i in range(1, len(result)):
                  current = result[i]
                  j = i - 1
                  while j >= 0 and result[j] > current:
                      result[j + 1] = result[j]   # shift bigger item right
                      j -= 1
                  result[j + 1] = current
                  print(result)
              return result

          insertion_sort([5, 2, 9, 1])
        `,
      },
    },
    {
      title: 'sorted() with a key',
      minutes: 3,
      analogy: 'A `key` function is telling the sorter **what to look at**: "sort these people by their age", "sort these words by length".',
      body: `\`sorted(items)\` returns a new sorted list; \`sorted(items, reverse=True)\` sorts biggest first.

To sort by something specific, pass a \`key\` function. A **lambda** is a tiny one-line function without a name:

\`\`\`python
sorted(words, key=lambda w: len(w))          # shortest first
sorted(people, key=lambda p: p["age"])       # by age
\`\`\`

\`lambda p: p["age"]\` means "given p, return p's age" — the same as a \`def\` with one \`return\`.

To sort by **two** things, return a tuple: \`key=lambda p: (p["team"], p["name"])\` sorts by team, then by name within each team. For descending numbers, negate: \`-p["score"]\`.`,
      example: {
        lang: 'python',
        code: code`
          words = ["banana", "kiwi", "apple", "fig"]
          print(sorted(words))
          print(sorted(words, key=lambda w: len(w)))
          people = [{"name": "Bo", "age": 40}, {"name": "Ada", "age": 36}]
          print(sorted(people, key=lambda p: p["age"]))
          print(sorted([3, 1, 2], reverse=True))
        `,
      },
    },
  ],
  practice: [
    {
      title: 'One bubble pass',
      minutes: 3,
      prompt: 'Write `bubble_pass(nums)` that returns a **copy** of `nums` after ONE pass of bubble sort: walk left to right, swapping each neighboring pair that\'s out of order. `[5, 1, 4, 2]` → `[1, 4, 2, 5]`.',
      starter: 'def bubble_pass(nums):\n    result = nums[:]\n    # one pass of swaps\n    return result\n',
      solution: 'def bubble_pass(nums):\n    result = nums[:]\n    for i in range(len(result) - 1):\n        if result[i] > result[i + 1]:\n            result[i], result[i + 1] = result[i + 1], result[i]\n    return result\n',
      solutionExplain: 'Each comparison swaps neighbors if needed, so after one pass the largest item has bubbled to the end.',
      hints: ['Loop `i` over `range(len(result) - 1)` and compare `result[i]` with `result[i + 1]`.', 'Swap with `result[i], result[i + 1] = result[i + 1], result[i]`.'],
      tests: [
        call('bubble_pass', [[5, 1, 4, 2]], [1, 4, 2, 5], '5 bubbles all the way to the end.'),
        call('bubble_pass', [[1, 2, 3]], [1, 2, 3], 'Already sorted → unchanged.'),
        check('Original unchanged', "a = [3, 1]\nbubble_pass(a)\nassert a == [3, 1]", 'Work on the copy, not the original list.'),
      ],
    },
    {
      title: 'Sort by age',
      minutes: 2,
      prompt: 'Write `by_age(people)` returning the people sorted youngest first, using `sorted` with a `key=lambda`.',
      starter: 'def by_age(people):\n    pass\n',
      solution: 'def by_age(people):\n    return sorted(people, key=lambda p: p["age"])\n',
      solutionExplain: 'The lambda tells `sorted` to compare people by their "age" value.',
      hints: ['`sorted(people, key=...)`', '`key=lambda p: p["age"]`'],
      tests: [call('by_age', [[{ name: 'Bo', age: 40 }, { name: 'Ada', age: 36 }]], [{ name: 'Ada', age: 36 }, { name: 'Bo', age: 40 }], 'Youngest first.')],
    },
  ],
  challenges: [
    {
      title: 'Insertion sort & leaderboard',
      minutes: 7,
      prompt: `**1. \`insertion_sort(nums)\`** — return a new sorted list using insertion sort. Don't use \`sorted()\` or \`.sort()\`, and don't change the input list.

**2. \`leaderboard(players)\`** — players are dicts with \`"name"\` and \`"score"\`. Return the **names** ordered by score **highest first**; players with equal scores are ordered **alphabetically**.

\`\`\`python
leaderboard([{"name": "Zed", "score": 50}, {"name": "Ada", "score": 90},
             {"name": "Bo", "score": 50}, {"name": "Cy", "score": 90}])
# ["Ada", "Cy", "Bo", "Zed"]
\`\`\``,
      starter: 'def insertion_sort(nums):\n    pass\n\n\ndef leaderboard(players):\n    pass\n',
      solution: 'def insertion_sort(nums):\n    result = nums[:]\n    for i in range(1, len(result)):\n        current = result[i]\n        j = i - 1\n        while j >= 0 and result[j] > current:\n            result[j + 1] = result[j]\n            j -= 1\n        result[j + 1] = current\n    return result\n\n\ndef leaderboard(players):\n    ordered = sorted(players, key=lambda p: (-p["score"], p["name"]))\n    return [p["name"] for p in ordered]\n',
      solutionExplain: 'Insertion sort shifts bigger items right until the current one fits. The leaderboard key is a tuple: `-score` puts high scores first, and `name` breaks ties alphabetically.',
      hints: [
        'Insertion sort: copy with `nums[:]`, then for each `i` from 1, shift bigger items right with a while loop. Leaderboard: `sorted` with a tuple key.',
        'Leaderboard key: `lambda p: (-p["score"], p["name"])`, then a comprehension to pull out the names.',
      ],
      tests: [
        call('insertion_sort', [[5, 2, 9, 1, 5]], [1, 2, 5, 5, 9], 'Sorted ascending, duplicates kept.'),
        call('insertion_sort', [[]], [], 'Empty list.'),
        call('insertion_sort', [[-1, -3, 0]], [-3, -1, 0], 'Negatives too.'),
        check('No built-in sort, input unchanged', "a = [3, 1, 2]\nassert insertion_sort(a) == [1, 2, 3] and a == [3, 1, 2], 'input was changed'\nbody = CODE.split('def leaderboard')[0]\nassert 'sorted(' not in body and '.sort(' not in body, 'insertion_sort must not use sorted/sort'", 'Write insertion sort by hand and leave the input list alone.'),
        call('leaderboard', [PLAYERS], ['Ada', 'Cy', 'Bo', 'Zed'], 'High scores first; ties alphabetical.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'print(sorted(["bb", "a", "ccc"], key=lambda s: -len(s)))',
      answers: ["['ccc', 'bb', 'a']"],
      explain: 'Negating the length sorts longest first.',
    },
    {
      kind: 'bug',
      prompt: 'Why does `result` print `None`?',
      code: 'nums = [3, 1, 2]\nresult = nums.sort()\nprint(result)',
      options: ['sort only works on strings', '`.sort()` sorts in place and returns None; use `sorted(nums)` for a new list', 'nums is empty', 'print can\'t show lists'],
      answer: 1,
      explain: '`.sort()` changes the list itself and returns None. `sorted()` returns a new list.',
    },
    {
      kind: 'concept',
      prompt: 'What is the Big-O of insertion sort on a large random list?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      answer: 3,
      explain: 'Each item may shift past all the earlier ones: a loop inside a loop.',
    },
  ],
});
