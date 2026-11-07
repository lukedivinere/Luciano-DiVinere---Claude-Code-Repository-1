import { check, code, defineLevel, out } from '../../dsl';

// Tests replace random.randint with a stand-in that always returns a known
// secret, and record how it was called.
const fixed = (n: number) => `import random\nCALLS = []\ndef _fake(a, b):\n    CALLS.append((a, b))\n    return ${n}\nrandom.randint = _fake\n`;
const INTRO = "I'm thinking of a number between 1 and 100.";

const step1 = code`
  import random

  secret = random.randint(1, 100)
  print("I'm thinking of a number between 1 and 100.")
`;

const step2 = code`
  import random

  secret = random.randint(1, 100)
  print("I'm thinking of a number between 1 and 100.")

  guess = int(input("Your guess: "))
  if guess < secret:
      print("Too low!")
  elif guess > secret:
      print("Too high!")
  else:
      print("You got it!")
`;

const step3 = code`
  import random

  secret = random.randint(1, 100)
  print("I'm thinking of a number between 1 and 100.")

  while True:
      guess = int(input("Your guess: "))
      if guess < secret:
          print("Too low!")
      elif guess > secret:
          print("Too high!")
      else:
          print("You got it!")
          break
`;

const step4 = code`
  import random

  secret = random.randint(1, 100)
  print("I'm thinking of a number between 1 and 100.")

  guesses = 0
  won = False
  while guesses < 7:
      guess = int(input("Your guess: "))
      guesses += 1
      if guess < secret:
          print("Too low!")
      elif guess > secret:
          print("Too high!")
      else:
          print(f"You got it in {guesses} guesses!")
          won = True
          break

  if not won:
      print(f"Out of guesses! The number was {secret}.")
`;

const step5 = code`
  import random


  def play(max_number, max_guesses):
      secret = random.randint(1, max_number)
      print(f"I'm thinking of a number between 1 and {max_number}.")
      guesses = 0
      while guesses < max_guesses:
          guess = int(input("Your guess: "))
          guesses += 1
          if guess < secret:
              print("Too low!")
          elif guess > secret:
              print("Too high!")
          else:
              print(f"You got it in {guesses} guesses!")
              return True
      print(f"Out of guesses! The number was {secret}.")
      return False


  wins = 0
  while True:
      level = input("Difficulty (easy/hard)? ")
      if level == "easy":
          won = play(10, 5)
      else:
          won = play(100, 7)
      if won:
          wins += 1
      again = input("Play again? (y/n) ")
      if again != "y":
          break

  print(f"Thanks for playing! You won {wins} game(s).")
`;

export default defineLevel({
  id: 'w1.boss',
  title: 'Number Guessing Game',
  kind: 'boss',
  icon: '🐉',
  summary: 'BOSS: build a complete game in 5 steps',
  lang: 'python',
  teaches: ['random'],
  requires: ['functions', 'return', 'while-loop', 'break', 'if-else', 'logic', 'input', 'conversion', 'fstrings', 'debugging'],
  learn: [
    {
      title: 'Boss briefing: the guessing game',
      minutes: 3,
      analogy: 'Real programmers build big things **one small working piece at a time** — like building a LEGO castle wall by wall, checking each wall stands before adding the next.',
      body: `You'll build a complete game: the computer picks a secret number, and the player guesses with "too high / too low" clues.

To pick a random number you need a **module** — a toolbox of extra code. \`import random\` loads the \`random\` module, then:

\`\`\`python
secret = random.randint(1, 100)   # a random whole number from 1 to 100
\`\`\`

The 5 steps:
1. Pick the secret
2. One guess with feedback
3. Keep guessing until correct
4. Count guesses, with a limit
5. Functions, difficulty levels and "play again"

Each step starts from the previous solution, so you can't fall behind. (Tests fix the "random" number so results are predictable.)`,
      example: { lang: 'python', code: code`
        import random

        for i in range(3):
            print(random.randint(1, 6))   # roll a die 3 times
      ` },
    },
  ],
  challenges: [
    {
      title: 'Step 1: Pick a secret',
      minutes: 3,
      prompt: `Import the \`random\` module, store a random number from **1 to 100** in a variable called \`secret\`, and print:

\`\`\`
${INTRO}
\`\`\``,
      starter: '# Step 1: import random and pick the secret\n',
      solution: step1,
      solutionExplain: '`import random` makes the module available; `random.randint(1, 100)` returns a random whole number from 1 to 100 inclusive.',
      hints: ['Start with `import random`. Then `secret = random.randint(...)`.', '`secret = random.randint(1, 100)` then print the intro line exactly.'],
      tests: [
        out('Prints the intro', INTRO, 'Print the intro sentence exactly (note the apostrophe in I\'m — use double quotes around the string).', undefined, fixed(42)),
        check('secret comes from randint(1, 100)', "assert CALLS == [(1, 100)], 'randint was called with ' + str(CALLS)\nassert secret == 42", 'Use `random.randint(1, 100)` once and store it in `secret`.', fixed(42)),
      ],
    },
    {
      title: 'Step 2: One guess',
      minutes: 3,
      prompt: `Read **one** guess as a whole number, then print \`Too low!\`, \`Too high!\` or \`You got it!\`.

If the secret is 42 and the player types \`30\`:

\`\`\`
${INTRO}
Too low!
\`\`\``,
      starter: step1 + '\n# Step 2: read a guess and compare it to secret\n',
      solution: step2,
      solutionExplain: 'Convert the guess with `int()`, then a three-way `if/elif/else` compares it to the secret.',
      hints: ['`guess = int(input("Your guess: "))` then compare `guess` with `secret`.', 'Use `if guess < secret:` → "Too low!", `elif guess > secret:` → "Too high!", `else:` → "You got it!".'],
      sampleInput: ['30'],
      tests: [
        out('Guess 30 (secret 42)', `${INTRO}\nToo low!`, '30 is below 42.', ['30'], fixed(42)),
        out('Guess 77 (secret 42)', `${INTRO}\nToo high!`, '77 is above 42.', ['77'], fixed(42)),
        out('Guess 42 (secret 42)', `${INTRO}\nYou got it!`, '42 is the secret.', ['42'], fixed(42)),
      ],
    },
    {
      title: 'Step 3: Keep guessing',
      minutes: 4,
      prompt: `Wrap the guessing in a loop so the player keeps guessing until they get it right. After "You got it!" the program ends.

Secret 42, typing \`50\`, \`25\`, \`42\`:

\`\`\`
${INTRO}
Too high!
Too low!
You got it!
\`\`\``,
      starter: step2.replace('\nguess = int', '\n# Step 3: put the guessing inside a loop\nguess = int'),
      solution: step3,
      solutionExplain: '`while True:` repeats the guess-and-compare block. The `break` in the correct branch is the way out.',
      hints: ['Use `while True:` and indent the guess and the if/elif/else inside it.', 'Add `break` right after `print("You got it!")`.'],
      sampleInput: ['50', '25', '42'],
      tests: [
        out('50, 25, 42', `${INTRO}\nToo high!\nToo low!\nYou got it!`, 'Keep asking until the guess is right, then stop.', ['50', '25', '42'], fixed(42)),
        out('Right first time', `${INTRO}\nYou got it!`, 'A correct first guess ends the game.', ['42'], fixed(42)),
        out('Five tries', `${INTRO}\nToo low!\nToo low!\nToo high!\nToo high!\nYou got it!`, 'The loop should handle any number of guesses.', ['1', '41', '43', '99', '42'], fixed(42)),
      ],
    },
    {
      title: 'Step 4: Count guesses, max 7',
      minutes: 4,
      prompt: `Count the guesses and give the player at most **7**.

- When they win, print \`You got it in N guesses!\` (instead of "You got it!").
- If they use all 7 without winning, print \`Out of guesses! The number was 42.\` (with the real secret).

Secret 42, typing \`50\`, \`42\` → \`You got it in 2 guesses!\``,
      starter: step3.replace('while True:', '# Step 4: count guesses (max 7)\nwhile True:'),
      solution: step4,
      solutionExplain: 'A `guesses` counter goes up each loop, and the loop condition `guesses < 7` enforces the limit. A `won` flag remembers whether the player won, so the "out of guesses" message only prints on a loss.',
      hints: [
        'Make `guesses = 0` before the loop and change it to `while guesses < 7:`. Add 1 to guesses after each input.',
        'Use a `won = False` flag: set it to True when they win. After the loop: `if not won:` print the out-of-guesses message with `{secret}`.',
      ],
      sampleInput: ['50', '42'],
      tests: [
        out('Win in 2', `${INTRO}\nToo high!\nYou got it in 2 guesses!`, 'Count every guess, including the winning one.', ['50', '42'], fixed(42)),
        out('Win in 1', `${INTRO}\nYou got it in 1 guesses!`, 'One correct guess → 1 guesses.', ['42'], fixed(42)),
        out('Lose after 7', `${INTRO}\n${'Too low!\n'.repeat(7)}Out of guesses! The number was 42.`, 'After 7 wrong guesses, stop asking and reveal the number.', ['1', '2', '3', '4', '5', '6', '7'], fixed(42)),
        out('Win on the 7th', `${INTRO}\n${'Too high!\n'.repeat(6)}You got it in 7 guesses!`, 'The 7th guess still counts if it\'s right.', ['90', '80', '70', '60', '50', '43', '42'], fixed(42)),
      ],
    },
    {
      title: 'Step 5: Difficulty & play again',
      minutes: 6,
      prompt: `Final step — make it a real game!

1. Move one round into a function \`play(max_number, max_guesses)\` that picks a secret from 1 to \`max_number\`, prints \`I'm thinking of a number between 1 and MAX.\`, runs the round, and **returns** \`True\` if the player won, \`False\` if not.
2. Before each round ask \`Difficulty (easy/hard)? \` — **easy** = \`play(10, 5)\`, anything else = \`play(100, 7)\`.
3. After each round ask \`Play again? (y/n) \`. Stop unless the answer is \`y\`.
4. At the end print \`Thanks for playing! You won N game(s).\``,
      starter: step4.replace('import random\n', "import random\n\n# Step 5: turn one round into play(max_number, max_guesses)\n# that returns True/False, then add difficulty + play again.\n"),
      solution: step5,
      solutionExplain: 'The round becomes a function with parameters for the range and guess limit, and `return True/False` reports the result instead of a flag. The outer `while True` loop handles difficulty, counting wins, and asking to play again.',
      hints: [
        'Indent your Step 4 code under `def play(max_number, max_guesses):`, replace 100 and 7 with the parameters, and use `return True` when they win / `return False` at the end.',
        'Outside the function: `wins = 0`, then `while True:` ask difficulty, call play, `if won: wins += 1`, ask play again, `break` unless "y". Print the thanks line after the loop.',
      ],
      sampleInput: ['easy', '5', '7', 'n'],
      tests: [
        out(
          'One easy win',
          `I'm thinking of a number between 1 and 10.\nToo low!\nYou got it in 2 guesses!\nThanks for playing! You won 1 game(s).`,
          'Easy mode uses 1–10. After the round, answering "n" ends the game with the summary.',
          ['easy', '5', '7', 'n'],
          fixed(7),
        ),
        out(
          'Hard loss, then easy win',
          `I'm thinking of a number between 1 and 100.\n${'Too low!\n'.repeat(7)}Out of guesses! The number was 7.\nI'm thinking of a number between 1 and 10.\nYou got it in 1 guesses!\nThanks for playing! You won 1 game(s).`,
          'Hard mode gives 7 guesses from 1–100. Typing "y" plays again; only wins are counted.',
          ['hard', '1', '1', '1', '1', '1', '1', '1', 'y', 'easy', '7', 'n'],
          fixed(7),
        ),
        out(
          'Easy has only 5 guesses',
          `I'm thinking of a number between 1 and 10.\n${'Too high!\n'.repeat(5)}Out of guesses! The number was 7.\nThanks for playing! You won 0 game(s).`,
          'Easy mode allows 5 guesses.',
          ['easy', '9', '9', '9', '9', '9', 'n'],
          fixed(7),
        ),
        check(
          'play() exists and uses its parameters',
          "assert callable(play), 'Define a function called play'\nCALLS.clear()\nr = play(10, 5)\nassert CALLS == [(1, 10)], 'play(10, 5) should call random.randint(1, 10), got ' + str(CALLS)\nassert r is True, 'play should return True when the player wins'",
          'Define `play(max_number, max_guesses)` that uses `random.randint(1, max_number)` and returns True on a win.',
          fixed(7),
          ['easy', '7', 'n', '7'],
        ),
      ],
    },
  ],
  quiz: [],
});
