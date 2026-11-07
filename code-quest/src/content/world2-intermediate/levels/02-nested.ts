import { call, code, defineLevel, out } from '../../dsl';

const STUDENTS = [
  { name: 'Ada', scores: [90, 85, 77] },
  { name: 'Alan', scores: [60, 75, 92] },
  { name: 'Grace', scores: [88, 94, 91] },
];

export default defineLevel({
  id: 'w2.l2',
  title: 'Nested Data',
  icon: '🪆',
  summary: 'Lists of dicts, dicts of lists — real-world data shapes',
  lang: 'python',
  teaches: ['nested-data'],
  requires: ['dicts', 'lists', 'functions', 'return', 'for-loop', 'math'],
  learn: [
    {
      title: 'Data inside data',
      minutes: 3,
      analogy: 'Nested data is like **folders inside folders**: open the outer folder, then the inner one, until you reach the file you want.',
      body: `Lists and dicts can hold **other** lists and dicts. This is **nested data**, and it's how real data (from apps, websites, spreadsheets) usually looks:

\`\`\`python
student = {"name": "Ada", "scores": [90, 85, 77]}
classroom = [
    {"name": "Ada", "age": 36},
    {"name": "Alan", "age": 41},
]
\`\`\`

To reach inside, **chain** the lookups, one step at a time, left to right:

- \`student["scores"]\` → \`[90, 85, 77]\`
- \`student["scores"][0]\` → \`90\`
- \`classroom[1]["name"]\` → \`"Alan"\`

If a chain confuses you, break it into steps with variables and print each one.`,
      example: { lang: 'python', code: code`
        classroom = [
            {"name": "Ada", "scores": [90, 85]},
            {"name": "Alan", "scores": [60, 75]},
        ]
        print(classroom[0])
        print(classroom[0]["name"])
        print(classroom[1]["scores"][-1])

        for student in classroom:
            print(student["name"], "has", len(student["scores"]), "scores")
      ` },
    },
  ],
  practice: [
    {
      title: 'Read a record',
      minutes: 2,
      prompt: `Print the student's name and their **second** score, then their last hobby:

\`\`\`
Ada
85
chess
\`\`\``,
      starter: 'student = {\n    "name": "Ada",\n    "scores": [90, 85, 77],\n    "hobbies": ["poetry", "math", "chess"],\n}\n',
      solution: 'student = {\n    "name": "Ada",\n    "scores": [90, 85, 77],\n    "hobbies": ["poetry", "math", "chess"],\n}\nprint(student["name"])\nprint(student["scores"][1])\nprint(student["hobbies"][-1])\n',
      solutionExplain: 'Chain the lookups: first the key, then the list position. Index 1 is the second item; -1 is the last.',
      hints: ['First get the list with `student["scores"]`, then index into it.', '`student["scores"][1]` and `student["hobbies"][-1]`.'],
      tests: [out('Prints Ada, 85, chess', 'Ada\n85\nchess', 'Chain a key lookup and then a list index.')],
    },
    {
      title: 'Total stock',
      minutes: 3,
      prompt: 'Write `total_quantity(inventory)` that adds up the `"qty"` of every item in a list of dicts.',
      starter: 'def total_quantity(inventory):\n    pass\n\n\nitems = [{"item": "apple", "qty": 3}, {"item": "pear", "qty": 5}]\nprint(total_quantity(items))\n',
      solution: 'def total_quantity(inventory):\n    total = 0\n    for entry in inventory:\n        total += entry["qty"]\n    return total\n\n\nitems = [{"item": "apple", "qty": 3}, {"item": "pear", "qty": 5}]\nprint(total_quantity(items))\n',
      solutionExplain: 'Each loop variable is one dict; `entry["qty"]` reaches its quantity, which we accumulate.',
      hints: ['Loop over the list — each item is a dict. Read its `"qty"`.', '`for entry in inventory: total += entry["qty"]`'],
      tests: [
        call('total_quantity', [[{ item: 'apple', qty: 3 }, { item: 'pear', qty: 5 }]], 8, '3 + 5 = 8.'),
        call('total_quantity', [[]], 0, 'An empty inventory has 0 items.'),
        call('total_quantity', [[{ item: 'x', qty: 10 }, { item: 'y', qty: 0 }, { item: 'z', qty: 2 }]], 12, 'Add every qty.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Class report',
      minutes: 6,
      prompt: `Each student is a dict with a \`"name"\` and a list of \`"scores"\`. Write:

1. \`class_report(students)\` → a **dict** mapping each name to their **average** score, rounded to 1 decimal.
2. \`top_student(students)\` → the **name** of the student with the highest average.

\`\`\`python
students = [
    {"name": "Ada", "scores": [90, 85, 77]},
    {"name": "Alan", "scores": [60, 75, 92]},
    {"name": "Grace", "scores": [88, 94, 91]},
]
class_report(students)  # {"Ada": 84.0, "Alan": 75.7, "Grace": 91.0}
top_student(students)   # "Grace"
\`\`\``,
      starter: 'def class_report(students):\n    pass\n\n\ndef top_student(students):\n    pass\n',
      solution: 'def class_report(students):\n    report = {}\n    for s in students:\n        scores = s["scores"]\n        report[s["name"]] = round(sum(scores) / len(scores), 1)\n    return report\n\n\ndef top_student(students):\n    report = class_report(students)\n    best = None\n    for name, avg in report.items():\n        if best is None or avg > report[best]:\n            best = name\n    return best\n',
      solutionExplain: '`class_report` builds a new dict: for each student, average their score list (`sum / len`) and store it under their name. `top_student` reuses the report and finds the key with the biggest value.',
      hints: [
        'Start with `report = {}`. For each student `s`, compute the average of `s["scores"]` and store it with `report[s["name"]] = ...`. (`sum()` and `len()` are fine here.)',
        'For `top_student`, call `class_report(students)` and loop over `.items()`, tracking the name with the highest average.',
      ],
      tests: [
        call('class_report', [STUDENTS], { Ada: 84.0, Alan: 75.7, Grace: 91.0 }, 'Average each student\'s scores and round to 1 decimal place.'),
        call('class_report', [[{ name: 'Solo', scores: [70] }]], { Solo: 70.0 }, 'A single score is its own average.'),
        call('top_student', [STUDENTS], 'Grace', 'Grace has the highest average (91.0).'),
        call('top_student', [[{ name: 'A', scores: [50, 50] }, { name: 'B', scores: [100, 0] }, { name: 'C', scores: [10] }]], 'A', 'A and B tie at 50.0 — return the first one, A.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'data = {"team": ["Ann", "Bo", "Cy"], "size": 3}\nprint(data["team"][1])',
      answers: ['Bo'],
      explain: '`data["team"]` is the list; index 1 of that list is "Bo".',
    },
    {
      kind: 'bug',
      prompt: 'This raises `TypeError: list indices must be integers or slices, not str`. Why?',
      code: 'people = [{"name": "Ann"}, {"name": "Bo"}]\nprint(people["name"])',
      options: ['"name" should be in single quotes', '`people` is a list, so you must pick an item first: `people[0]["name"]`', 'Dicts can\'t be in lists', 'print can\'t show names'],
      answer: 1,
      explain: 'The outer value is a list, which uses number positions. Pick one dict first, then use the key.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'grid = [[1, 2], [3, 4]]\nprint(grid[1][0])',
      answers: ['3'],
      explain: '`grid[1]` is `[3, 4]`, and its index 0 is 3. A list of lists works like rows and columns.',
    },
  ],
});
