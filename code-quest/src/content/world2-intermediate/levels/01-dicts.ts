import { call, check, code, defineLevel, out } from '../../dsl';

export default defineLevel({
  id: 'w2.l1',
  title: 'Dictionaries',
  icon: '📖',
  summary: 'Look things up by name with key → value pairs',
  lang: 'python',
  teaches: ['dicts'],
  requires: ['lists', 'functions', 'return', 'for-loop', 'if-else', 'string-methods'],
  learn: [
    {
      title: 'Keys and values',
      minutes: 3,
      analogy: 'A dictionary is like a **real dictionary** or a phone\'s contacts: you look up a **word** (the key) to find its **meaning** (the value). You don\'t need to know what page it\'s on.',
      body: `A **dictionary** (\`dict\`) stores **key → value** pairs inside curly braces:

\`\`\`python
ages = {"Ada": 36, "Alan": 41}
\`\`\`

- Look up a value by its key: \`ages["Ada"]\` → \`36\`
- Add or change: \`ages["Grace"] = 85\`
- Check a key exists: \`"Ada" in ages\` → \`True\`
- Remove: \`del ages["Alan"]\`

Lists find things by **position** (0, 1, 2…); dicts find things by **key**. Keys are usually strings and must be unique.

Looking up a missing key crashes with **KeyError**. The safe way is \`.get(key, default)\`, which returns the default instead: \`ages.get("Bob", 0)\` → \`0\`.`,
      example: { lang: 'python', code: code`
        ages = {"Ada": 36, "Alan": 41}
        print(ages["Ada"])
        ages["Grace"] = 85        # add
        ages["Ada"] = 37          # change
        print(ages)
        print("Bob" in ages, ages.get("Bob", "unknown"))
      ` },
    },
    {
      title: 'Looping and counting',
      minutes: 3,
      analogy: 'Counting votes with a **tally sheet**: each time a name comes up, find its row and add a mark — or start a new row if it\'s the first vote.',
      body: `Loop over a dict to get its keys, or use \`.items()\` to get key **and** value together:

\`\`\`python
for name, age in ages.items():
    print(name, "is", age)
\`\`\`

The **counting pattern** is one of the most useful in programming:

\`\`\`python
counts = {}
for word in ["hi", "yo", "hi"]:
    counts[word] = counts.get(word, 0) + 1
# {'hi': 2, 'yo': 1}
\`\`\`

\`.get(word, 0)\` reads the current count (0 if new), then we store one more. \`len(d)\` gives the number of keys.`,
      example: { lang: 'python', code: code`
        votes = ["cat", "dog", "cat", "fish", "cat"]
        counts = {}
        for v in votes:
            counts[v] = counts.get(v, 0) + 1

        for animal, n in counts.items():
            print(f"{animal}: {n}")
        print(len(counts), "different animals")
      ` },
    },
  ],
  practice: [
    {
      title: 'Phone book',
      minutes: 2,
      prompt: `Add Grace's number (\`"555-0303"\`) to the phone book, then read a name and print that person's number. If the name isn't there, print \`Unknown\`.`,
      starter: 'phone = {"Ada": "555-0101", "Alan": "555-0202"}\n# Add Grace, then look up a typed name\n',
      solution: 'phone = {"Ada": "555-0101", "Alan": "555-0202"}\nphone["Grace"] = "555-0303"\nname = input("Name? ")\nprint(phone.get(name, "Unknown"))\n',
      solutionExplain: 'Assigning to a new key adds it. `.get(name, "Unknown")` returns the number or the default without crashing.',
      hints: ['Add with `phone["Grace"] = ...`. Look up with `.get()` so a missing name doesn\'t crash.', '`print(phone.get(name, "Unknown"))`'],
      sampleInput: ['Grace'],
      tests: [
        out('Grace', '555-0303', 'Grace should be added to the phone book.', ['Grace']),
        out('Ada', '555-0101', 'Ada was already there.', ['Ada']),
        out('Missing name', 'Unknown', 'Use .get(name, "Unknown") so missing names print Unknown.', ['Zed']),
      ],
    },
    {
      title: 'Letter counter',
      minutes: 3,
      prompt: 'Write `count_letters(word)` that returns a dict counting each letter. `count_letters("banana")` → `{"b": 1, "a": 3, "n": 2}`.',
      starter: 'def count_letters(word):\n    counts = {}\n    # your loop here\n    return counts\n',
      solution: 'def count_letters(word):\n    counts = {}\n    for ch in word:\n        counts[ch] = counts.get(ch, 0) + 1\n    return counts\n',
      solutionExplain: 'The counting pattern: for each character, read its count with `.get(ch, 0)` and store one more.',
      hints: ['Loop over each character and use the counting pattern from the lesson.', '`counts[ch] = counts.get(ch, 0) + 1`'],
      tests: [
        call('count_letters', ['banana'], { b: 1, a: 3, n: 2 }, 'banana has 1 b, 3 a\'s and 2 n\'s.'),
        call('count_letters', ['aaa'], { a: 3 }, 'Every repeat should add one.'),
        call('count_letters', [''], {}, 'An empty word gives an empty dict.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Word frequency',
      minutes: 5,
      prompt: `Write \`word_frequency(text)\` that returns a dict of how often each word appears.

- Words are separated by spaces — \`text.split()\` gives you a list of words.
- Count words **case-insensitively**: "The" and "the" are the same word (store them lowercase).

\`word_frequency("The cat and the hat")\` → \`{"the": 2, "cat": 1, "and": 1, "hat": 1}\`

Then write \`most_common(text)\` that returns the word with the highest count (if there's a tie, the one that appears **first** in the text).`,
      starter: 'def word_frequency(text):\n    pass\n\n\ndef most_common(text):\n    pass\n',
      solution: 'def word_frequency(text):\n    counts = {}\n    for word in text.lower().split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts\n\n\ndef most_common(text):\n    counts = word_frequency(text)\n    best = None\n    for word in text.lower().split():\n        if best is None or counts[word] > counts[best]:\n            best = word\n    return best\n',
      solutionExplain: '`word_frequency` lowercases, splits into words, and counts. `most_common` reuses it — one function calling another — then walks the words in order, replacing `best` only when a count is strictly bigger, so ties keep the earliest word.',
      hints: [
        '`text.lower().split()` gives a list of lowercase words. Then use the counting pattern. For `most_common`, call `word_frequency` first.',
        'In `most_common`, loop over the words in order and keep `best` — update it only if `counts[word] > counts[best]` (strictly greater keeps the first one on ties).',
      ],
      tests: [
        call('word_frequency', ['The cat and the hat'], { the: 2, cat: 1, and: 1, hat: 1 }, 'Lowercase every word before counting.'),
        call('word_frequency', ['go Go GO stop'], { go: 3, stop: 1 }, '"go", "Go" and "GO" are the same word.'),
        call('word_frequency', [''], {}, 'Empty text → empty dict.'),
        call('most_common', ['the cat and the hat'], 'the', '"the" appears twice.'),
        call('most_common', ['b a a b'], 'b', 'Tie between a and b → return the one that appears first ("b").'),
        check('most_common reuses word_frequency', "assert 'word_frequency(' in CODE.split('def most_common')[1], 'Call word_frequency inside most_common'", 'Don\'t repeat yourself: call `word_frequency(text)` inside `most_common`.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'stock = {"apples": 3}\nstock["pears"] = 5\nstock["apples"] += 2\nprint(stock["apples"], len(stock))',
      answers: ['5 2'],
      explain: 'apples goes from 3 to 5, and there are now 2 keys.',
    },
    {
      kind: 'bug',
      prompt: 'This crashes with `KeyError: \'blue\'`. What\'s the safest fix?',
      code: 'colors = {"red": "#f00"}\nprint(colors["blue"])',
      options: ['Use `colors[0]`', 'Use `colors.get("blue", "not found")`', 'Use `colors("blue")`', 'Wrap "blue" in brackets'],
      answer: 1,
      explain: '`.get` returns a default instead of crashing when the key is missing.',
    },
    {
      kind: 'concept',
      prompt: 'When is a dict a better choice than a list?',
      options: ['When order is all that matters', 'When you want to look items up by a name/label', 'When you have only numbers', 'Never'],
      answer: 1,
      explain: 'Dicts shine when you look things up by a key, like a username or product code.',
    },
  ],
});
