// Turns raw Python / JavaScript / SQL errors into plain English with a hint.
import type { Lang, RunError } from '../engine/types';

interface Rule {
  test: (e: RunError) => RegExpMatchArray | boolean | null;
  title: string;
  meaning: (m: RegExpMatchArray | null, e: RunError) => string;
  hint: (m: RegExpMatchArray | null, e: RunError) => string;
}

const byType = (type: string, re?: RegExp) => (e: RunError) =>
  e.type === type ? (re ? e.message.match(re) : true) : null;

const PY: Rule[] = [
  {
    test: byType('SyntaxError', /unterminated string literal|EOL while scanning/),
    title: 'Unfinished text (string)',
    meaning: () => 'Python found text that starts with a quote mark but never ends with one.',
    hint: () => 'Every string needs a matching pair of quotes: "like this" or \'like this\'.',
  },
  {
    test: byType('SyntaxError', /expected ':'/),
    title: 'Missing colon',
    meaning: () => 'Lines that start a block (if, elif, else, for, while, def, class) must end with a colon `:`.',
    hint: () => 'Add `:` at the end of that line, e.g. `if x > 3:`.',
  },
  {
    test: byType('SyntaxError', /'\(' was never closed|'\[' was never closed|'\{' was never closed|unmatched|closing parenthesis/),
    title: 'Brackets don\'t match',
    meaning: () => 'An opening bracket ( [ or { has no matching closing bracket (or the other way round).',
    hint: () => 'Count your brackets on that line. Each ( needs a ), each [ needs a ].',
  },
  {
    test: byType('SyntaxError', /invalid syntax\. Maybe you meant '==' or ':=' instead of '='\?|cannot assign to/),
    title: 'Used = instead of ==',
    meaning: () => 'A single `=` stores a value. To *compare* two values you need a double `==`.',
    hint: () => 'In conditions write `if x == 5:` not `if x = 5:`.',
  },
  {
    test: byType('SyntaxError', /Perhaps you forgot a comma/),
    title: 'Missing comma',
    meaning: () => 'Python saw two values side by side with nothing joining them.',
    hint: () => 'Separate items with commas: `print("a", "b")` or `[1, 2, 3]`.',
  },
  {
    test: byType('SyntaxError'),
    title: 'Python can\'t read this line',
    meaning: (_m, e) => `The code breaks Python's grammar rules ("${e.message}"), so nothing ran.`,
    hint: () => 'Look at the highlighted line and the one just above it: check quotes, brackets, colons and spelling.',
  },
  {
    test: (e) => e.type === 'IndentationError' || e.type === 'TabError',
    title: 'Indentation problem',
    meaning: (_m, e) =>
      /expected an indented block/.test(e.message)
        ? 'After a line ending in `:` Python expects the next line(s) to be indented (pushed right).'
        : 'The spaces at the start of a line don\'t line up with the code around it.',
    hint: () => 'Use 4 spaces for each level. Lines in the same block must start at the same column.',
  },
  {
    test: byType('NameError', /name '(.+?)' is not defined/),
    title: 'Unknown name',
    meaning: (m) => `Python doesn't know anything called \`${m?.[1]}\`. It was never created, or it's spelled differently.`,
    hint: (m) =>
      `Check spelling and capital letters of \`${m?.[1]}\`. If it's text, put it in quotes: "${m?.[1]}". If it's a variable, assign it before you use it.`,
  },
  {
    test: byType('TypeError', /can only concatenate str \(not "(.+?)"\) to str/),
    title: 'Mixing text and numbers with +',
    meaning: (m) => `You tried to glue text to a ${m?.[1]} with +. Python won't guess how to combine them.`,
    hint: () => 'Convert the number to text with str(n), or use an f-string: f"Score: {n}".',
  },
  {
    test: byType('TypeError', /unsupported operand type\(s\) for (.+?): '(.+?)' and '(.+?)'/),
    title: 'Wrong types for this math',
    meaning: (m) => `You used ${m?.[1]} between a ${m?.[2]} and a ${m?.[3]}, which Python can't do.`,
    hint: () => 'Values from input() are always text (str). Convert with int(...) or float(...) before doing math.',
  },
  {
    test: byType('TypeError', /'(.+?)' object is not callable/),
    title: 'Called something that isn\'t a function',
    meaning: (m) => `You put ( ) after a ${m?.[1]} value as if it were a function.`,
    hint: () => 'Did you reuse a function\'s name (like `list` or `print`) as a variable? Rename the variable.',
  },
  {
    test: byType('TypeError', /missing (\d+) required positional argument/),
    title: 'Missing argument',
    meaning: () => 'A function was called with fewer values than it needs.',
    hint: () => 'Compare the call `f(...)` with the definition `def f(...)` — give it one value per parameter.',
  },
  {
    test: byType('TypeError', /takes (\d+) positional arguments? but (\d+) (were|was) given/),
    title: 'Too many arguments',
    meaning: (m) => `The function accepts ${m?.[1]} value(s) but got ${m?.[2]}.`,
    hint: () => 'In a class method, remember `self` must be the first parameter of every method.',
  },
  {
    test: byType('TypeError'),
    title: 'Wrong type of value',
    meaning: (_m, e) => `An operation got a kind of value it can't work with: ${e.message}.`,
    hint: () => 'Print the values with print(type(x)) to see what type each one really is.',
  },
  {
    test: byType('ValueError', /invalid literal for int\(\) with base 10: '(.*)'/),
    title: 'Text can\'t become a whole number',
    meaning: (m) => `int() was given "${m?.[1]}", which isn't a whole number.`,
    hint: () => 'int() only works on text like "42". For "3.5" use float(). Use try/except to handle bad input.',
  },
  {
    test: byType('ValueError'),
    title: 'Right type, wrong value',
    meaning: (_m, e) => `The value has the right type but an impossible value: ${e.message}.`,
    hint: () => 'Print the value just before this line to see what it actually contains.',
  },
  {
    test: byType('IndexError'),
    title: 'Position doesn\'t exist',
    meaning: () => 'You asked for an item at a position past the end of the list or string. Positions start at 0, so the last is len(x) - 1.',
    hint: () => 'Check your loop range and indexes. A list of 3 items has positions 0, 1 and 2.',
  },
  {
    test: byType('KeyError', /'?(.+?)'?$/),
    title: 'Key not in the dictionary',
    meaning: (m) => `The dictionary has no key ${m?.[1]}.`,
    hint: () => 'Check spelling/capitals, or use d.get(key, default) to get a fallback instead of an error.',
  },
  {
    test: byType('AttributeError', /'(.+?)' object has no attribute '(.+?)'/),
    title: 'That value doesn\'t have this feature',
    meaning: (m) => `A ${m?.[1]} has no attribute or method called \`${m?.[2]}\`.`,
    hint: () => 'Check spelling. Note a method like .upper() works on strings, .append() on lists.',
  },
  {
    test: byType('ZeroDivisionError'),
    title: 'Divided by zero',
    meaning: () => 'Dividing by 0 has no answer in math, so Python stops.',
    hint: () => 'Check the divisor before dividing: `if count != 0:`.',
  },
  {
    test: byType('RecursionError'),
    title: 'Function called itself forever',
    meaning: () => 'A recursive function never reached its base case, so the calls piled up until Python gave up.',
    hint: () => 'Make sure there\'s a base case that returns without recursing, and that each call moves toward it.',
  },
  {
    test: byType('InputExhausted'),
    title: 'Asked for more input than given',
    meaning: () => 'Your program called input() more times than the test typed answers.',
    hint: () => 'Check your loop stops at the right moment (e.g. after a correct guess or "quit").',
  },
  {
    test: byType('AssertionError'),
    title: 'An assert failed',
    meaning: (_m, e) => `An \`assert\` statement found something false${e.message ? `: ${e.message}` : ''}.`,
    hint: () => 'Read the assert condition and print the values it compares.',
  },
];

const JS: Rule[] = [
  {
    test: byType('ReferenceError', /(.+?) is not defined/),
    title: 'Unknown name',
    meaning: (m) => `JavaScript doesn't know anything called \`${m?.[1]}\`.`,
    hint: (m) => `Check spelling and capitals of \`${m?.[1]}\`, declare it with let/const first, or put text in quotes.`,
  },
  {
    test: byType('ReferenceError', /before initialization/),
    title: 'Used before it was created',
    meaning: () => 'You used a let/const variable on a line above where it is declared.',
    hint: () => 'Move the declaration above the first use.',
  },
  {
    test: byType('TypeError', /Assignment to constant variable/),
    title: 'Changed a const',
    meaning: () => 'A `const` can\'t be reassigned after it\'s created.',
    hint: () => 'Use `let` for values that change.',
  },
  {
    test: byType('TypeError', /(.+?) is not a function/),
    title: 'Not a function',
    meaning: (m) => `You called \`${m?.[1]}\` with ( ) but it isn't a function.`,
    hint: () => 'Check the spelling of the method (e.g. `push`, `toUpperCase`) and that the value is the type you expect.',
  },
  {
    test: byType('TypeError', /Cannot read propert(y|ies) of (undefined|null)/),
    title: 'Looked inside nothing',
    meaning: (m) => `You used a dot (.) or [ ] on a value that is ${m?.[2]}.`,
    hint: () => 'Something earlier gave undefined/null — a misspelled key, a missing return, or querySelector found no element.',
  },
  {
    test: byType('SyntaxError', /Unexpected end of input/),
    title: 'Code ends too early',
    meaning: () => 'A { ( or [ was opened but never closed.',
    hint: () => 'Count your braces: every { needs a }.',
  },
  {
    test: byType('SyntaxError', /Invalid or unexpected token|Unterminated string/),
    title: 'Unfinished text or stray character',
    meaning: () => 'There\'s a quote without its partner, or a character JavaScript can\'t read.',
    hint: () => 'Check that each string starts and ends with the same kind of quote.',
  },
  {
    test: byType('SyntaxError'),
    title: 'JavaScript can\'t read this code',
    meaning: (_m, e) => `The code breaks JavaScript's grammar rules (${e.message}), so nothing ran.`,
    hint: () => 'Check brackets, quotes, commas and that keywords are spelled right.',
  },
  {
    test: byType('RangeError', /call stack/),
    title: 'Function called itself forever',
    meaning: () => 'A recursive function never reached its base case.',
    hint: () => 'Add or fix the base case so recursion stops.',
  },
  {
    test: byType('AssertionError'),
    title: 'An assert failed',
    meaning: (_m, e) => `An assertion found something false: ${e.message}.`,
    hint: () => 'Log the values being compared to see what they really are.',
  },
];

const SQL: Rule[] = [
  {
    test: (e) => e.message.match(/no such table: (\S+)/),
    title: 'Table doesn\'t exist',
    meaning: (m) => `There's no table named \`${m?.[1]}\`.`,
    hint: () => 'Check the table names in the schema panel — spelling matters.',
  },
  {
    test: (e) => e.message.match(/no such column: (\S+)/),
    title: 'Column doesn\'t exist',
    meaning: (m) => `There's no column named \`${m?.[1]}\` in the tables you used.`,
    hint: () => 'Check the column names, and if you JOIN, prefix with the table name: orders.id.',
  },
  {
    test: (e) => e.message.match(/near "(.+?)": syntax error/),
    title: 'SQL grammar mistake',
    meaning: (m) => `SQLite got confused near \`${m?.[1]}\`.`,
    hint: () => 'Check clause order: SELECT … FROM … JOIN … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT. Text values need single quotes.',
  },
  {
    test: (e) => e.message.match(/ambiguous column name: (\S+)/),
    title: 'Which table\'s column?',
    meaning: (m) => `\`${m?.[1]}\` exists in more than one joined table.`,
    hint: (m) => `Write it as table.${m?.[1]} so SQL knows which one.`,
  },
  {
    test: (e) => /misuse of aggregate/.test(e.message),
    title: 'Aggregate in the wrong place',
    meaning: () => 'COUNT/SUM/AVG can\'t be used in WHERE.',
    hint: () => 'Filter groups with HAVING (after GROUP BY) instead of WHERE.',
  },
  {
    test: () => true,
    title: 'SQL error',
    meaning: (_m, e) => e.message,
    hint: () => 'Read the query clause by clause and compare with the examples.',
  },
];

export function translateError(e: RunError, lang: Lang): RunError {
  if (e.type === 'Timeout') return TIMEOUT_ERROR;
  const rules = lang === 'python' ? PY : lang === 'sql' ? SQL : JS;
  for (const r of rules) {
    const m = r.test(e);
    if (m) {
      const mm = typeof m === 'boolean' ? null : m;
      const where = e.line ? ` (line ${e.line})` : '';
      return { ...e, friendly: { title: r.title + where, meaning: r.meaning(mm, e), hint: r.hint(mm, e) } };
    }
  }
  return {
    ...e,
    friendly: {
      title: `${e.type}${e.line ? ` (line ${e.line})` : ''}`,
      meaning: e.message,
      hint: 'Read the message, look at that line, and print values just before it to see what is happening.',
    },
  };
}

export const TIMEOUT_ERROR: RunError = {
  type: 'Timeout',
  message: 'Your code ran for too long and was stopped.',
  friendly: {
    title: 'Code never finished',
    meaning: 'Your program kept running past the time limit — usually a loop whose condition never becomes false.',
    hint: 'Check every while loop: does something inside it change so the condition eventually becomes False? Is there a break?',
  },
};
