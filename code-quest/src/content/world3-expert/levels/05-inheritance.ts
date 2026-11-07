import { check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w3.l5',
  title: 'OOP: Inheritance',
  icon: '🧬',
  summary: 'Subclasses, super(), overriding — in Python and JS',
  lang: 'python',
  teaches: ['inheritance'],
  requires: ['classes', 'js-functions', 'js-objects', 'try-except'],
  learn: [
    {
      title: 'Subclasses: "is a"',
      minutes: 3,
      analogy: 'A **family recipe** passed down: the child recipe starts with everything from the parent, then changes a few ingredients or adds new ones.',
      body: `**Inheritance** lets a new class reuse an existing one. The new class is a **subclass** (child); the original is the **superclass** (parent).

\`\`\`python
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "..."

class Dog(Animal):                 # Dog inherits from Animal
    def speak(self):               # override the parent's method
        return f"{self.name} says woof"
\`\`\`

\`Dog\` gets \`__init__\` for free and **overrides** \`speak\`. Use inheritance when the child truly **is a** kind of parent: a Dog *is an* Animal.

\`super()\` calls the parent's version of a method — usually to extend \`__init__\`:

\`\`\`python
def __init__(self, name, tricks):
    super().__init__(name)
    self.tricks = tricks
\`\`\``,
      example: {
        lang: 'python',
        code: code`
          class Animal:
              def __init__(self, name):
                  self.name = name
              def speak(self):
                  return f"{self.name} makes a sound"

          class Dog(Animal):
              def __init__(self, name, tricks):
                  super().__init__(name)
                  self.tricks = tricks
              def speak(self):
                  return f"{self.name} says woof and knows {len(self.tricks)} tricks"

          for pet in [Animal("Generic"), Dog("Rex", ["sit", "roll"])]:
              print(pet.speak())
          print(isinstance(Dog("x", []), Animal))
        `,
      },
    },
    {
      title: 'Inheritance in JavaScript',
      minutes: 2,
      analogy: 'Same family recipe, written in a different language\'s cookbook.',
      body: `JS has classes too, with \`extends\` and \`super\`. \`constructor\` is JS's \`__init__\`, and \`this\` is JS's \`self\` (you don't list it as a parameter):

\`\`\`js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} makes a sound\`; }
}
class Dog extends Animal {
  speak() { return \`\${this.name} says woof\`; }
}
new Dog("Rex").speak();   // objects are created with new
\`\`\`

**Polymorphism**: code that calls \`pet.speak()\` works for any animal — each object answers in its own way. That's the real payoff of inheritance.`,
      example: {
        lang: 'javascript',
        code: code`
          class Animal {
            constructor(name) { this.name = name; }
            speak() { return \`\${this.name} makes a sound\`; }
          }
          class Cat extends Animal {
            speak() { return \`\${this.name} says meow\`; }
          }
          for (const pet of [new Animal("Generic"), new Cat("Tom")]) {
            console.log(pet.speak());
          }
        `,
      },
      compare: {
        left: { lang: 'python', code: 'class Cat(Animal):\n    def __init__(self, name):\n        super().__init__(name)\n    def speak(self):\n        return f"{self.name} meows"' },
        right: { lang: 'javascript', code: 'class Cat extends Animal {\n  constructor(name) {\n    super(name);\n  }\n  speak() {\n    return `${this.name} meows`;\n  }\n}' },
        same: ['Subclass inherits and can override methods', '`super` reaches the parent', 'Polymorphism: same method name, different behavior'],
        different: ['`extends` vs `(Parent)`', '`constructor`/`this` vs `__init__`/`self`', 'JS creates objects with `new`'],
      },
    },
  ],
  practice: [
    {
      title: 'Override a method',
      minutes: 2,
      prompt: 'Create `Duck(Animal)` whose `speak()` returns `"NAME says quack"`. Don\'t write an `__init__` — inherit it.',
      starter: 'class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return f"{self.name} makes a sound"\n\n\n# class Duck ...\n',
      solution: 'class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return f"{self.name} makes a sound"\n\n\nclass Duck(Animal):\n    def speak(self):\n        return f"{self.name} says quack"\n',
      solutionExplain: '`Duck(Animal)` inherits the constructor; defining `speak` again overrides the parent\'s version.',
      hints: ['`class Duck(Animal):` then define only `speak`.', '`return f"{self.name} says quack"`'],
      tests: [
        check('Duck speaks', "assert Duck('Donald').speak() == 'Donald says quack'", 'Duck("Donald").speak() → "Donald says quack".'),
        check('Is an Animal', "assert isinstance(Duck('d'), Animal)", 'Duck must inherit from Animal.'),
        check('No duplicate __init__', "assert CODE.count('def __init__') == 1, 'Inherit __init__ instead of rewriting it'", 'Reuse the parent\'s constructor.'),
      ],
    },
    {
      title: 'Extend with super()',
      minutes: 3,
      prompt: 'Create `Employee(Person)` with `__init__(self, name, salary)` that calls `super().__init__(name)` and stores `salary`. Add `describe()` returning `"NAME earns SALARY"`.',
      starter: 'class Person:\n    def __init__(self, name):\n        self.name = name\n',
      solution: 'class Person:\n    def __init__(self, name):\n        self.name = name\n\n\nclass Employee(Person):\n    def __init__(self, name, salary):\n        super().__init__(name)\n        self.salary = salary\n\n    def describe(self):\n        return f"{self.name} earns {self.salary}"\n',
      solutionExplain: '`super().__init__(name)` lets the parent set `name`; the child then adds its own attribute.',
      hints: ['First line of the child `__init__`: `super().__init__(name)`.', 'Then `self.salary = salary`, and a `describe` method.'],
      tests: [
        check('describe', "assert Employee('Ada', 5000).describe() == 'Ada earns 5000'", '"Ada earns 5000".'),
        check('Uses super()', "assert 'super().__init__' in CODE", 'Call the parent constructor with super().'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Shapes (Python)',
      minutes: 5,
      prompt: `Build a shape hierarchy:

- \`Shape\` has \`area()\` that raises \`NotImplementedError\` (subclasses must override it), and \`describe()\` returning \`"NAME with area AREA"\` where NAME is \`self.name\` and AREA is \`area()\` rounded to 2 decimals.
- \`Rectangle(width, height)\` — name \`"Rectangle"\`, area = width × height.
- \`Square(side)\` — a **subclass of Rectangle** (a square *is a* rectangle) with name \`"Square"\`.
- \`Circle(radius)\` — name \`"Circle"\`, area = π r² (use \`3.14159\`).

\`total_area(shapes)\` returns the sum of all areas, rounded to 2 — it shouldn't care what kind each shape is.`,
      starter: 'class Shape:\n    name = "Shape"\n\n    def area(self):\n        raise NotImplementedError("Subclasses must implement area()")\n\n    def describe(self):\n        pass\n',
      solution: 'class Shape:\n    name = "Shape"\n\n    def area(self):\n        raise NotImplementedError("Subclasses must implement area()")\n\n    def describe(self):\n        return f"{self.name} with area {round(self.area(), 2)}"\n\n\nclass Rectangle(Shape):\n    name = "Rectangle"\n\n    def __init__(self, width, height):\n        self.width = width\n        self.height = height\n\n    def area(self):\n        return self.width * self.height\n\n\nclass Square(Rectangle):\n    name = "Square"\n\n    def __init__(self, side):\n        super().__init__(side, side)\n\n\nclass Circle(Shape):\n    name = "Circle"\n\n    def __init__(self, radius):\n        self.radius = radius\n\n    def area(self):\n        return 3.14159 * self.radius ** 2\n\n\ndef total_area(shapes):\n    return round(sum([s.area() for s in shapes]), 2)\n',
      solutionExplain: '`name = "..."` inside a class body is a **class attribute**, shared by all objects of that class and overridden per subclass. `Square` reuses Rectangle\'s area by passing `side` twice to `super().__init__`. `total_area` relies on polymorphism: every shape answers `area()` its own way.',
      hints: [
        'Each subclass sets its own `name = "..."` at the top of the class and implements `area()`. `describe` in Shape can use `self.name` and `self.area()`.',
        '`class Square(Rectangle):` with `def __init__(self, side): super().__init__(side, side)` — no new area method needed.',
      ],
      tests: [
        check('Rectangle', "r = Rectangle(3, 4)\nassert r.area() == 12 and r.describe() == 'Rectangle with area 12', r.describe()", 'Rectangle(3, 4) → area 12, "Rectangle with area 12".'),
        check('Square is a Rectangle', "s = Square(5)\nassert isinstance(s, Rectangle) and s.area() == 25 and s.describe() == 'Square with area 25', s.describe()", 'Square(5) → area 25, subclass of Rectangle.'),
        check('Circle', "c = Circle(2)\nassert c.describe() == 'Circle with area 12.57', c.describe()", 'Circle(2) → 12.57 (rounded).'),
        check('Shape.area is abstract', "try:\n    Shape().area()\n    assert False, 'No error'\nexcept NotImplementedError:\n    pass", 'Shape().area() should raise NotImplementedError.'),
        check('total_area', "assert total_area([Rectangle(3, 4), Square(2), Circle(1)]) == 19.14, total_area([Rectangle(3, 4), Square(2), Circle(1)])", '12 + 4 + 3.14159 = 19.14.'),
      ],
    },
    {
      title: 'Shapes (JavaScript)',
      lang: 'javascript',
      minutes: 4,
      prompt: `Port the core of it to JS: classes \`Rectangle(width, height)\` and \`Square(side)\` (which \`extends Rectangle\`), each with an \`area()\` method and a \`describe()\` returning \`"Rectangle with area 12"\` / \`"Square with area 25"\`.

Put \`describe()\` once in Rectangle and use \`this.constructor.name\` — it gives the class name of the actual object.`,
      starter: 'class Rectangle {\n}\n\nclass Square extends Rectangle {\n}\n',
      solution: 'class Rectangle {\n  constructor(width, height) {\n    this.width = width;\n    this.height = height;\n  }\n  area() {\n    return this.width * this.height;\n  }\n  describe() {\n    return `${this.constructor.name} with area ${this.area()}`;\n  }\n}\n\nclass Square extends Rectangle {\n  constructor(side) {\n    super(side, side);\n  }\n}\n',
      solutionExplain: 'Square passes `side` twice to the parent constructor via `super`. `describe` is inherited, and `this.constructor.name` reports the real class, so one method serves both.',
      hints: ['Rectangle: a `constructor(width, height)` that sets `this.width`/`this.height`, plus `area()` and `describe()`.', 'Square: `constructor(side) { super(side, side); }`'],
      tests: [
        check('Rectangle', "const r = new Rectangle(3, 4);\nassert(r.area() === 12 && r.describe() === 'Rectangle with area 12', r.describe());", 'new Rectangle(3, 4) → 12.'),
        check('Square', "const s = new Square(5);\nassert(s instanceof Rectangle, 'Square must extend Rectangle');\nassert(s.describe() === 'Square with area 25', s.describe());", 'new Square(5) → "Square with area 25".'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'class A:\n    def hi(self):\n        return "A"\n\nclass B(A):\n    pass\n\nclass C(A):\n    def hi(self):\n        return "C" + super().hi()\n\nprint(B().hi(), C().hi())',
      answers: ['A CA'],
      explain: 'B inherits hi unchanged. C overrides it and calls the parent\'s version with super().',
    },
    {
      kind: 'bug',
      prompt: 'Creating `Dog("Rex", 3)` works, but `.name` raises AttributeError. Why?',
      code: 'class Animal:\n    def __init__(self, name):\n        self.name = name\n\nclass Dog(Animal):\n    def __init__(self, name, age):\n        self.age = age',
      options: ['Dog can\'t have its own __init__', 'Dog\'s __init__ replaces the parent\'s and never calls super().__init__(name)', 'age must come first', 'Missing return'],
      answer: 1,
      explain: 'Overriding __init__ means the parent\'s no longer runs automatically. Call `super().__init__(name)`.',
    },
    {
      kind: 'concept',
      prompt: 'When is inheritance a good fit?',
      options: ['Whenever two classes share any code', 'When the child truly "is a" kind of the parent', 'Always — it\'s faster', 'Never'],
      answer: 1,
      explain: 'Inheritance models "is a". For "has a" relationships, use composition (next level).',
    },
  ],
});
