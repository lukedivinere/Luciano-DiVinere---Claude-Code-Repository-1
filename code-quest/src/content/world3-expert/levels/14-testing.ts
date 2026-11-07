import { check, code, defineLevel } from '../../dsl';

// Each check hands the learner's test function a correct implementation
// (which must pass) and buggy ones (which must be caught).
const mutation = (testFn: string, good: string, bad: [string, string][]) =>
  [
    check(
      'Your test passes the correct version',
      `${good}\ntry:\n    ${testFn}(impl)\nexcept AssertionError as e:\n    assert False, 'Your test failed the CORRECT implementation: ' + str(e)`,
      'Your tests must pass when the function is correct — check your expected values.',
    ),
    ...bad.map(([label, src]) =>
      check(
        `Catches bug: ${label}`,
        `${src}\ntry:\n    ${testFn}(impl)\n    caught = False\nexcept AssertionError:\n    caught = True\nassert caught, 'Your test did not catch this bug'`,
        `A buggy version (${label}) slipped through. Add an assert for that case.`,
      ),
    ),
  ];

export default defineLevel({
  id: 'w3.l14',
  title: 'Writing Your Own Tests',
  icon: '🧪',
  summary: 'assert, test functions, edge cases — catch bugs before users do',
  lang: 'python',
  teaches: ['testing'],
  requires: ['functions', 'try-except', 'js-functions', 'debugging'],
  learn: [
    {
      title: 'Tests are code that checks code',
      minutes: 3,
      analogy: 'A test is a **smoke alarm** for your program: you set it up once, and it shouts the moment something breaks — even months later when you change something unrelated.',
      body: `Every challenge in Code Quest has hidden tests. Now you'll write your own.

\`assert condition, "message"\` does nothing if the condition is True, and raises **AssertionError** with your message if it's False.

A **test function** groups related checks:

\`\`\`python
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(0, 0) == 0
\`\`\`

Good tests cover:
- **Normal cases** (typical inputs)
- **Edge cases**: empty lists, zero, negatives, one item, the exact boundary (\`>=\` vs \`>\`)
- **Error cases**: bad input raises the right exception

Real projects run hundreds of tests automatically with tools like **pytest** (Python) or **Vitest/Jest** (JavaScript).`,
      example: {
        lang: 'python',
        code: code`
          def add(a, b):
              return a + b

          def test_add():
              assert add(2, 3) == 5, "2 + 3 should be 5"
              assert add(-1, 1) == 0, "-1 + 1 should be 0"
              print("all add tests passed ✅")

          test_add()

          def broken_add(a, b):
              return a - b
          try:
              assert broken_add(2, 3) == 5, "2 + 3 should be 5"
          except AssertionError as e:
              print("caught a bug:", e)
        `,
      },
      compare: {
        left: { lang: 'python', code: 'def test_add():\n    assert add(2, 3) == 5' },
        right: { lang: 'javascript', code: 'test("add", () => {\n  expect(add(2, 3)).toBe(5);\n});' },
        same: ['Call the code with known inputs; compare with expected outputs', 'A failing check stops the test with a message'],
        different: ['Python uses plain `assert`; JS test tools use `expect(...).toBe(...)`', 'pytest finds `test_*` functions; Vitest/Jest use `test(...)` blocks'],
      },
    },
    {
      title: 'Testing the tests',
      minutes: 2,
      analogy: 'To check a smoke alarm works, you **hold a lit match under it**. Here the grader holds deliberately broken code under your tests.',
      body: `How do you know your tests are any good? Feed them **broken** versions of the code and see if they complain. This is called **mutation testing**.

In this level, your test function takes the function under test as a **parameter**, so the grader can hand it different versions:

\`\`\`python
def test_is_even(is_even):
    assert is_even(4) is True
    assert is_even(7) is False
\`\`\`

The grader checks that your test:
1. **passes** with the correct implementation, and
2. **fails** (raises AssertionError) for each buggy implementation.

If a bug slips through, think: what input would expose it? Usually an edge case.`,
      example: {
        lang: 'python',
        code: code`
          def test_is_even(is_even):
              assert is_even(4) is True
              assert is_even(7) is False

          def good(n): return n % 2 == 0
          def sneaky(n): return n == 4       # wrong, but passes 4 and 7!

          test_is_even(good)
          test_is_even(sneaky)
          print("Both passed — so this test is too weak. Try adding is_even(2).")
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Test is_even',
      minutes: 3,
      prompt: 'Write `test_is_even(is_even)` with asserts that pass for a correct `is_even(n)` but catch these bugs: one that returns `n % 2 == 1`, and one that always returns `True`.',
      starter: 'def test_is_even(is_even):\n    assert is_even(4) is True\n',
      solution: 'def test_is_even(is_even):\n    assert is_even(4) is True\n    assert is_even(7) is False\n    assert is_even(0) is True\n',
      solutionExplain: 'An odd input exposes "always True"; 4 and 0 expose the flipped version. Testing 0 covers an edge case too.',
      hints: ['The starter only checks an even number. What would an always-True function get wrong?', 'Add `assert is_even(7) is False` (and maybe `is_even(0)`).'],
      tests: mutation('test_is_even', 'def impl(n):\n    return n % 2 == 0', [
        ['flipped (n % 2 == 1)', 'def impl(n):\n    return n % 2 == 1'],
        ['always True', 'def impl(n):\n    return True'],
      ]),
    },
    {
      title: 'The negative-numbers edge case',
      minutes: 3,
      prompt: 'Write `test_biggest(biggest)` for a function that returns the largest number in a non-empty list. Catch a version that starts its search at `0` instead of the first item (it\'s wrong for all-negative lists) and one that returns the first item.',
      starter: 'def test_biggest(biggest):\n    assert biggest([1, 5, 3]) == 5\n',
      solution: 'def test_biggest(biggest):\n    assert biggest([1, 5, 3]) == 5\n    assert biggest([-4, -2, -9]) == -2\n    assert biggest([7]) == 7\n',
      solutionExplain: 'An all-negative list catches the "start at 0" bug: it would return 0, which isn\'t even in the list.',
      hints: ['Which input makes "start at 0" return a wrong answer?', 'Add `assert biggest([-4, -2, -9]) == -2`.'],
      tests: mutation('test_biggest', 'def impl(nums):\n    best = nums[0]\n    for n in nums:\n        if n > best:\n            best = n\n    return best', [
        ['starts at 0', 'def impl(nums):\n    best = 0\n    for n in nums:\n        if n > best:\n            best = n\n    return best'],
        ['returns first item', 'def impl(nums):\n    return nums[0]'],
      ]),
    },
  ],
  challenges: [
    {
      title: 'Bulletproof password tests',
      minutes: 7,
      prompt: `A sign-up form uses \`password_ok(pw)\`, which returns True when **all** of these are true:

- at least **8** characters long
- contains at least one **digit**
- contains at least one **uppercase** letter

Write \`test_password_ok(password_ok)\` that passes for a correct implementation and catches all **four** hidden buggy versions. Think about each rule separately, and about the exact boundary (7 vs 8 characters). Use at least 5 asserts.`,
      starter: 'def test_password_ok(password_ok):\n    assert password_ok("Secret123") is True\n',
      solution: 'def test_password_ok(password_ok):\n    assert password_ok("Secret123") is True\n    assert password_ok("Abcdefg1") is True     # exactly 8 is fine\n    assert password_ok("Abcdef1") is False     # 7 is too short\n    assert password_ok("Abcdefgh") is False    # no digit\n    assert password_ok("abcdefg1") is False    # no uppercase\n    assert password_ok("") is False            # empty\n',
      solutionExplain: 'One assert per rule, each breaking exactly one rule so you know which check failed, plus both sides of the length boundary (7 and 8). Comments document *why* each case exists.',
      hints: [
        'For each rule, write a password that breaks ONLY that rule and assert it\'s False. Also test exactly 8 characters (should be True) and 7 (False).',
        'Examples: "Abcdefg1" (8, OK), "Abcdef1" (7, too short), "Abcdefgh" (no digit), "abcdefg1" (no uppercase).',
      ],
      tests: [
        ...mutation(
          'test_password_ok',
          'def impl(pw):\n    return len(pw) >= 8 and any(c.isdigit() for c in pw) and any(c.isupper() for c in pw)',
          [
            ['length > 8 instead of >= 8', 'def impl(pw):\n    return len(pw) > 8 and any(c.isdigit() for c in pw) and any(c.isupper() for c in pw)'],
            ['length >= 7', 'def impl(pw):\n    return len(pw) >= 7 and any(c.isdigit() for c in pw) and any(c.isupper() for c in pw)'],
            ['forgets the digit rule', 'def impl(pw):\n    return len(pw) >= 8 and any(c.isupper() for c in pw)'],
            ['forgets the uppercase rule', 'def impl(pw):\n    return len(pw) >= 8 and any(c.isdigit() for c in pw)'],
          ],
        ),
        check('At least 5 asserts', "assert CODE.count('assert ') >= 5, 'Only ' + str(CODE.count('assert ')) + ' asserts'", 'Write at least 5 asserts.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'concept',
      prompt: 'What is an edge case?',
      options: ['A typical input', 'An input at the limits: empty, zero, boundary values, negatives', 'A syntax error', 'A slow test'],
      answer: 1,
      explain: 'Edge cases sit at the boundaries, where bugs love to hide.',
    },
    {
      kind: 'bug',
      prompt: 'This test never fails, even for a broken `double`. Why?',
      code: 'def test_double():\n    double(4) == 8',
      options: ['double is not called', 'There is no `assert`, so the comparison result is just thrown away', '8 should be "8"', 'Tests can\'t use =='],
      answer: 1,
      explain: 'Without `assert`, the comparison is evaluated and ignored. Write `assert double(4) == 8`.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'try:\n    assert 2 + 2 == 5, "math is broken"\nexcept AssertionError as e:\n    print(e)',
      answers: ['math is broken'],
      explain: 'The assert fails and raises AssertionError carrying your message.',
    },
  ],
});
