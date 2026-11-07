import { check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w3.l6',
  title: 'OOP: Composition',
  icon: '🧱',
  summary: '"Has a" beats "is a" — build objects from parts',
  lang: 'python',
  teaches: ['composition'],
  requires: ['inheritance', 'classes', 'lists'],
  learn: [
    {
      title: 'Has-a vs is-a',
      minutes: 3,
      analogy: 'A car isn\'t a *kind of* engine — a car **has** an engine, wheels and a radio. Swap the engine for an electric one and it\'s still a car. That\'s **composition**.',
      body: `**Composition** means building an object from other objects it holds as attributes:

\`\`\`python
class Engine:
    def start(self):
        return "vroom"

class Car:
    def __init__(self, engine):
        self.engine = engine          # Car HAS an Engine
    def start(self):
        return self.engine.start()    # delegate the work
\`\`\`

Why prefer it? Deep inheritance trees get rigid: a \`FlyingSwimmingFireDragon\` subclass for every combination explodes. With composition you mix and match parts at runtime.

Rule of thumb: use inheritance for a true **is-a** relationship; use composition for **has-a** — and when in doubt, choose composition.`,
      example: {
        lang: 'python',
        code: code`
          class Engine:
              def start(self):
                  return "vroom"

          class ElectricMotor:
              def start(self):
                  return "hummm"

          class Car:
              def __init__(self, name, engine):
                  self.name = name
                  self.engine = engine
              def start(self):
                  return f"{self.name}: {self.engine.start()}"

          print(Car("Classic", Engine()).start())
          print(Car("Tesla-ish", ElectricMotor()).start())   # swap the part!
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Car has an engine',
      minutes: 3,
      prompt: 'Make `Car(engine)` store the engine. `car.start()` must return `"Starting... "` followed by whatever the engine\'s `start()` returns. Don\'t inherit from Engine.',
      starter: 'class Engine:\n    def start(self):\n        return "vroom"\n\n\nclass Car:\n    pass\n',
      solution: 'class Engine:\n    def start(self):\n        return "vroom"\n\n\nclass Car:\n    def __init__(self, engine):\n        self.engine = engine\n\n    def start(self):\n        return "Starting... " + self.engine.start()\n',
      solutionExplain: 'The Car keeps an engine object and delegates to it. Any object with a `start()` method works.',
      hints: ['Store the engine: `self.engine = engine`.', '`return "Starting... " + self.engine.start()`'],
      tests: [
        check('Delegates to the engine', "assert Car(Engine()).start() == 'Starting... vroom'", 'Car(Engine()).start() → "Starting... vroom".'),
        check('Works with any engine', "class Motor:\n    def start(self):\n        return 'zap'\nassert Car(Motor()).start() == 'Starting... zap'", 'A different engine object should just work.'),
        check('Not inheritance', "assert not issubclass(Car, Engine)", 'Car has an engine — it is not an engine.'),
      ],
    },

    {
      title: 'Playlist has songs',
      minutes: 3,
      prompt: 'Make `Song(title, seconds)` and `Playlist()`. A Playlist **has** songs: `add(song)`, `total_seconds()`, and `longest()` returning the title of the longest song (or `None` if empty).',
      starter: 'class Song:\n    pass\n\n\nclass Playlist:\n    pass\n',
      solution: 'class Song:\n    def __init__(self, title, seconds):\n        self.title = title\n        self.seconds = seconds\n\n\nclass Playlist:\n    def __init__(self):\n        self.songs = []\n\n    def add(self, song):\n        self.songs.append(song)\n\n    def total_seconds(self):\n        return sum([s.seconds for s in self.songs])\n\n    def longest(self):\n        if not self.songs:\n            return None\n        return max(self.songs, key=lambda s: s.seconds).title\n',
      solutionExplain: 'The Playlist holds Song objects in a list and asks them for their data — composition in its simplest form.',
      hints: ['Playlist keeps `self.songs = []`; total uses a comprehension over `s.seconds`.', '`longest`: guard for empty, then `max(self.songs, key=lambda s: s.seconds).title`.'],
      tests: [
        check('Totals and longest', "pl = Playlist()\npl.add(Song('Intro', 90)); pl.add(Song('Epic', 420)); pl.add(Song('Outro', 60))\nassert pl.total_seconds() == 570 and pl.longest() == 'Epic'", '90 + 420 + 60 = 570; Epic is longest.'),
        check('Empty playlist', "assert Playlist().total_seconds() == 0 and Playlist().longest() is None", 'Empty: 0 seconds and None.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Refactor the class explosion',
      minutes: 7,
      prompt: `A game used inheritance for every ability combo: \`Knight\`, \`Wizard\`, \`FlyingWizard\`, \`FlyingKnightWizard\`… it doesn't scale. Rebuild it with composition:

- Ability classes \`Sword\`, \`Fireball\` and \`Wings\`, each with a method \`use(name)\` returning:
  - Sword: \`"NAME swings a sword"\`
  - Fireball: \`"NAME casts a fireball"\`
  - Wings: \`"NAME flies"\`
- \`Character(name, abilities)\` stores a list of ability objects.
  - \`act()\` returns a list of every ability's \`use(...)\` result, in order.
  - \`add_ability(ability)\` adds one more.
  - \`can(kind)\` returns True if it has an ability of that class, e.g. \`hero.can(Wings)\` (use \`isinstance\`).`,
      starter: '# Old design (don\'t extend this — replace it):\n# class Knight: ...\n# class Wizard: ...\n# class FlyingWizard(Wizard): ...\n# class FlyingKnightWizard(FlyingWizard): ...\n\n',
      solution: 'class Sword:\n    def use(self, name):\n        return f"{name} swings a sword"\n\n\nclass Fireball:\n    def use(self, name):\n        return f"{name} casts a fireball"\n\n\nclass Wings:\n    def use(self, name):\n        return f"{name} flies"\n\n\nclass Character:\n    def __init__(self, name, abilities):\n        self.name = name\n        self.abilities = list(abilities)\n\n    def act(self):\n        return [a.use(self.name) for a in self.abilities]\n\n    def add_ability(self, ability):\n        self.abilities.append(ability)\n\n    def can(self, kind):\n        return any([isinstance(a, kind) for a in self.abilities])\n',
      solutionExplain: 'Each ability is a tiny class with the same `use` method, so Character can treat them all alike. New combos need zero new classes — just a different list. `list(abilities)` copies the list so two characters never share one by accident. `any([...])` is True if at least one item is True.',
      hints: [
        'Three small ability classes with a `use(self, name)` method each. Character stores `self.abilities` and loops over them.',
        '`act`: `[a.use(self.name) for a in self.abilities]`. `can`: check `isinstance(a, kind)` for any ability — `any([...])` helps.',
      ],
      tests: [
        check('Act with several abilities', "hero = Character('Ari', [Sword(), Wings()])\nassert hero.act() == ['Ari swings a sword', 'Ari flies'], str(hero.act())", 'act() returns each ability\'s message, in order.'),
        check('Add an ability later', "hero = Character('Ari', [Sword()])\nhero.add_ability(Fireball())\nassert hero.act() == ['Ari swings a sword', 'Ari casts a fireball']", 'add_ability appends to the list.'),
        check('can()', "hero = Character('Ari', [Fireball()])\nassert hero.can(Fireball) is True and hero.can(Wings) is False", 'can(Wings) is False until the hero has Wings.'),
        check('No ability is shared', "a = [Sword()]\nx = Character('X', a)\ny = Character('Y', a)\nx.add_ability(Wings())\nassert not y.can(Wings), 'Characters share one abilities list!'", 'Copy the list in __init__ so characters don\'t share it.'),
        check('No inheritance tree', "assert 'class FlyingWizard' not in CODE.replace('# class FlyingWizard', '')", 'Replace the combo classes with composition.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'concept',
      prompt: 'Which relationship suits composition?',
      options: ['A Square is a Shape', 'A Playlist has Songs', 'A Dog is an Animal', 'A Manager is an Employee'],
      answer: 1,
      explain: 'A playlist contains songs — "has a" → composition.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'class Loud:\n    def say(self, t):\n        return t.upper()\n\nclass Bot:\n    def __init__(self, voice):\n        self.voice = voice\n    def talk(self):\n        return self.voice.say("hi")\n\nprint(Bot(Loud()).talk())',
      answers: ['HI'],
      explain: 'Bot delegates to its voice object, which uppercases the text.',
    },
    {
      kind: 'bug',
      prompt: 'Two teams end up with the same players. Why?',
      code: 'class Team:\n    def __init__(self, players=[]):\n        self.players = players\n    def add(self, p):\n        self.players.append(p)\n\na = Team(); b = Team()\na.add("Ann")\nprint(b.players)   # ["Ann"]!',
      options: ['append is broken', 'The default `[]` is created once and shared by every Team; use `None` and create a new list inside', 'Teams must inherit from list', 'b is the same object as a'],
      answer: 1,
      explain: 'Mutable default arguments are shared. Use `players=None` and `self.players = players or []` (or `list(players)`).',
    },
  ],
});
