import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w2.l7',
  title: 'String Manipulation',
  icon: '✂️',
  summary: 'split, join, strip, replace, slicing and more',
  lang: 'python',
  teaches: ['string-manipulation', 'slicing'],
  requires: ['strings', 'string-methods', 'indexing', 'lists', 'functions', 'return'],
  learn: [
    {
      title: 'split, join, strip, replace',
      minutes: 3,
      analogy: '`split` is **cutting a sentence into word cards**; `join` is **taping the cards back together** with whatever tape you choose.',
      body: `- \`s.split()\` breaks text into a **list** of words (on spaces). \`s.split(",")\` breaks on commas instead.
- \`"-".join(words)\` glues a list of strings together, putting \`"-"\` between each.
- \`s.strip()\` removes spaces (and newlines) from both ends.
- \`s.replace("old", "new")\` swaps every \`old\` for \`new\`.
- \`s.find("x")\` gives the index of the first \`"x"\` (or \`-1\` if missing).
- \`s.startswith("ab")\`, \`s.endswith(".py")\` → True/False.
- \`s.capitalize()\` uppercases the first letter; \`s.isdigit()\` checks all characters are digits; \`s.isalnum()\` checks letters or digits.

All return **new** strings — strings can never be changed in place.`,
      example: { lang: 'python', code: code`
        line = "  apple, banana ,cherry "
        parts = line.strip().split(",")
        print(parts)
        clean = []
        for p in parts:
            clean.append(p.strip())
        print(" | ".join(clean))
        print("hello world".replace("o", "0"))
        print("report.pdf".endswith(".pdf"), "abc".find("c"))
      ` },
    },
    {
      title: 'Slicing',
      minutes: 2,
      analogy: 'Slicing is cutting a **slice of bread from a loaf**: you say where to start cutting and where to stop.',
      body: `A **slice** takes part of a string (or list): \`s[start:stop]\` — from \`start\` up to but **not including** \`stop\`, just like \`range\`.

\`\`\`python
s = "Python"
s[0:2]    # 'Py'
s[2:]     # 'thon'   (to the end)
s[:3]     # 'Pyt'    (from the start)
s[-2:]    # 'on'     (last two)
s[::-1]   # 'nohtyP' (step -1 = reversed!)
\`\`\`

Slices never cause IndexError — if you go past the end, you just get what's there. They work on lists too: \`nums[1:3]\`.`,
      example: { lang: 'python', code: code`
        s = "Python"
        print(s[0:2], s[2:], s[:3], s[-2:])
        print(s[::-1])
        nums = [10, 20, 30, 40, 50]
        print(nums[1:3], nums[-2:])
      ` },
    },
  ],
  practice: [
    {
      title: 'Title case',
      minutes: 3,
      prompt: 'Write `title_case(s)` that capitalizes the first letter of every word and lowercases the rest: `title_case("hELLo wORLD")` → `"Hello World"`. Use `split`, `capitalize` and `join` (not `.title()`).',
      starter: 'def title_case(s):\n    pass\n',
      solution: 'def title_case(s):\n    words = []\n    for w in s.split():\n        words.append(w.capitalize())\n    return " ".join(words)\n',
      solutionExplain: 'Split into words, capitalize each one (which also lowercases the rest), then join with spaces.',
      hints: ['Split into words, transform each word, join them back with a space.', '`" ".join(words)` after appending `w.capitalize()` for each word.'],
      tests: [
        call('title_case', ['hELLo wORLD'], 'Hello World', 'Each word: first letter upper, rest lower.'),
        call('title_case', ['code quest is fun'], 'Code Quest Is Fun', 'Every word gets capitalized.'),
        check('No .title()', "assert '.title(' not in CODE", 'Build it yourself with split/capitalize/join.'),
      ],
    },
    {
      title: 'Reverse the words',
      minutes: 2,
      prompt: 'Write `reverse_words(s)` that reverses the **order** of the words: `"one two three"` → `"three two one"`. Hint: slicing works on lists too.',
      starter: 'def reverse_words(s):\n    pass\n',
      solution: 'def reverse_words(s):\n    return " ".join(s.split()[::-1])\n',
      solutionExplain: '`split()` gives a list of words, `[::-1]` reverses the list, and `join` glues them back.',
      hints: ['Split into a list, reverse the list, join it back.', '`" ".join(s.split()[::-1])`'],
      tests: [
        call('reverse_words', ['one two three'], 'three two one', 'Reverse the word order, not the letters.'),
        call('reverse_words', ['solo'], 'solo', 'One word stays the same.'),
        call('reverse_words', ['  a   b  '], 'b a', 'split() ignores extra spaces.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'CSV parser & slug maker',
      minutes: 6,
      prompt: `Two real-world text tools:

**1. \`parse_csv_line(line)\`** splits a comma-separated line into a list of fields, with spaces trimmed from each field:
\`parse_csv_line(" Ada , 36,London ")\` → \`["Ada", "36", "London"]\`

**2. \`slugify(title)\`** makes a web-address-friendly "slug":
- lowercase
- keep only letters, digits and spaces (drop punctuation)
- words joined by single hyphens

\`slugify("Hello, World! 2026")\` → \`"hello-world-2026"\`
\`slugify("  Python   Tips & Tricks ")\` → \`"python-tips-tricks"\``,
      starter: 'def parse_csv_line(line):\n    pass\n\n\ndef slugify(title):\n    pass\n',
      solution: 'def parse_csv_line(line):\n    fields = []\n    for part in line.split(","):\n        fields.append(part.strip())\n    return fields\n\n\ndef slugify(title):\n    kept = ""\n    for ch in title.lower():\n        if ch.isalnum() or ch == " ":\n            kept += ch\n    return "-".join(kept.split())\n',
      solutionExplain: '`parse_csv_line` splits on commas and strips each piece. `slugify` lowercases, keeps only letters/digits/spaces (`isalnum()`), then `split()` + `"-".join` turns any run of spaces into a single hyphen and drops spaces at the ends.',
      hints: [
        'CSV: `line.split(",")`, then `.strip()` each part. Slug: build a new string keeping only characters where `ch.isalnum() or ch == " "`.',
        'Finish the slug with `"-".join(kept.split())` — `split()` with no argument handles multiple spaces for you.',
      ],
      tests: [
        call('parse_csv_line', [' Ada , 36,London '], ['Ada', '36', 'London'], 'Split on commas, then strip each field.'),
        call('parse_csv_line', ['a,,b'], ['a', '', 'b'], 'An empty field stays as an empty string.'),
        call('slugify', ['Hello, World! 2026'], 'hello-world-2026', 'Lowercase, drop punctuation, hyphens between words.'),
        call('slugify', ['  Python   Tips & Tricks '], 'python-tips-tricks', 'Multiple spaces become one hyphen; no hyphens at the ends.'),
        call('slugify', ['ALL CAPS'], 'all-caps', 'Lowercase everything.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'word = "keyboard"\nprint(word[3:6])',
      answers: ['boa'],
      explain: 'Indexes 3, 4, 5 → b, o, a. The stop index 6 is not included.',
      concept: 'slicing',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'print("-".join(["a", "b", "c"]))',
      answers: ['a-b-c'],
      explain: 'join puts the separator between each item.',
    },
    {
      kind: 'bug',
      prompt: 'This should remove spaces from `name`, but `name` still has them. Why?',
      code: 'name = "  Ada  "\nname.strip()\nprint(name)',
      options: ['strip only removes newlines', 'Strings can\'t be changed; strip returns a NEW string that was thrown away', 'It needs strip(" ")', 'print adds the spaces back'],
      answer: 1,
      explain: 'Store the result: `name = name.strip()`.',
    },
  ],
});
