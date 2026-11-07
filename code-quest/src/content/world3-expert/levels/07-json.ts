import { call, check, code, defineLevel } from '../../dsl';

const ORDERS = JSON.stringify({
  store: 'Code Café',
  orders: [
    { id: 1, customer: 'Ada', items: [{ name: 'latte', price: 3.5, qty: 2 }, { name: 'muffin', price: 2.25, qty: 1 }] },
    { id: 2, customer: 'Alan', items: [{ name: 'tea', price: 2.0, qty: 1 }] },
    { id: 3, customer: 'Ada', items: [] },
  ],
});

export default defineLevel({
  id: 'w3.l7',
  title: 'JSON',
  icon: '📦',
  summary: 'The web\'s data format — in Python and JavaScript',
  lang: 'python',
  teaches: ['json'],
  requires: ['nested-data', 'dicts', 'js-objects', 'try-except', 'comprehensions'],
  learn: [
    {
      title: 'Data as text',
      minutes: 3,
      analogy: 'JSON is a **shipping box with a standard label format**: any program in any language can pack data into it as text, send it, and the receiver can unpack it exactly.',
      body: `**JSON** (JavaScript Object Notation) is a text format for data. It looks almost exactly like Python dicts/lists and JS objects/arrays:

\`\`\`json
{"name": "Ada", "age": 36, "langs": ["Python", "JS"], "admin": true, "boss": null}
\`\`\`

Rules: keys **must** use double quotes; values are strings, numbers, \`true\`/\`false\`, \`null\`, arrays or objects.

**Parsing** turns JSON text into real data; **serializing** turns data back into text:

| | Python (\`import json\`) | JavaScript |
|---|---|---|
| text → data | \`json.loads(text)\` | \`JSON.parse(text)\` |
| data → text | \`json.dumps(data)\` | \`JSON.stringify(data)\` |

Python converts \`true\`→\`True\` and \`null\`→\`None\` for you. Invalid JSON raises \`json.JSONDecodeError\` (a kind of ValueError).`,
      example: {
        lang: 'python',
        code: code`
          import json

          text = '{"name": "Ada", "langs": ["Python", "JS"], "admin": true, "boss": null}'
          data = json.loads(text)
          print(data["langs"][1], data["admin"], data["boss"])

          data["langs"].append("SQL")
          print(json.dumps(data))
          print(json.dumps({"a": 1, "b": [1, 2]}, indent=2))
        `,
      },
      compare: {
        left: { lang: 'python', code: 'import json\ndata = json.loads(text)\nprint(data["name"])\nout = json.dumps(data)' },
        right: { lang: 'javascript', code: 'const data = JSON.parse(text);\nconsole.log(data.name);\nconst out = JSON.stringify(data);' },
        same: ['Same JSON text works in both languages', 'Parse text → nested dicts/objects and lists/arrays', 'Serialize back to text to save or send'],
        different: ['Python needs `import json`; JS has `JSON` built in', 'Python shows True/None; JS shows true/null', 'Bad JSON: JSONDecodeError vs SyntaxError'],
      },
    },
  ],
  practice: [
    {
      title: 'Parse and read',
      minutes: 2,
      prompt: 'Write `favorite_color(json_text)` that parses JSON like `\'{"user": {"name": "Bo", "prefs": {"color": "teal"}}}\'` and returns the color.',
      starter: 'import json\n\n\ndef favorite_color(json_text):\n    pass\n',
      solution: 'import json\n\n\ndef favorite_color(json_text):\n    data = json.loads(json_text)\n    return data["user"]["prefs"]["color"]\n',
      solutionExplain: '`json.loads` gives nested dicts, then chained lookups reach the value.',
      hints: ['`data = json.loads(json_text)`', 'Then chain: `data["user"]["prefs"]["color"]`.'],
      tests: [call('favorite_color', ['{"user": {"name": "Bo", "prefs": {"color": "teal"}}}'], 'teal', 'Chain the keys user → prefs → color.')],
    },
    {
      title: 'Safe parse',
      minutes: 2,
      prompt: 'Write `safe_parse(text)` returning the parsed data, or `None` if the text isn\'t valid JSON.',
      starter: 'import json\n\n\ndef safe_parse(text):\n    return json.loads(text)\n',
      solution: 'import json\n\n\ndef safe_parse(text):\n    try:\n        return json.loads(text)\n    except json.JSONDecodeError:\n        return None\n',
      solutionExplain: 'Bad JSON raises `json.JSONDecodeError`; catching it lets you return a safe value instead of crashing.',
      hints: ['Wrap `json.loads` in try/except.', '`except json.JSONDecodeError: return None`'],
      tests: [call('safe_parse', ['[1, 2]'], [1, 2], 'Valid JSON parses.'), call('safe_parse', ["{'single': 'quotes'}"], null, 'Single quotes aren\'t valid JSON → None.'), call('safe_parse', [''], null, 'Empty text → None.')],
    },
  ],
  challenges: [
    {
      title: 'Order summary',
      minutes: 6,
      prompt: `A café's API returns orders as JSON text (example below). Write \`summarize(json_text)\` that returns a **dict**:

- \`"store"\`: the store name
- \`"order_count"\`: number of orders
- \`"revenue"\`: total of price × qty over all items, rounded to 2
- \`"by_customer"\`: dict from customer to their total spend (rounded to 2), including customers who spent 0

Then write \`summary_json(json_text)\` that returns \`summarize(...)\` serialized back to JSON text with \`json.dumps(..., sort_keys=True)\`.

\`\`\`json
${ORDERS}
\`\`\``,
      starter: 'import json\n\n\ndef summarize(json_text):\n    pass\n\n\ndef summary_json(json_text):\n    pass\n',
      solution: 'import json\n\n\ndef summarize(json_text):\n    data = json.loads(json_text)\n    revenue = 0\n    by_customer = {}\n    for order in data["orders"]:\n        order_total = sum([item["price"] * item["qty"] for item in order["items"]])\n        revenue += order_total\n        name = order["customer"]\n        by_customer[name] = round(by_customer.get(name, 0) + order_total, 2)\n    return {\n        "store": data["store"],\n        "order_count": len(data["orders"]),\n        "revenue": round(revenue, 2),\n        "by_customer": by_customer,\n    }\n\n\ndef summary_json(json_text):\n    return json.dumps(summarize(json_text), sort_keys=True)\n',
      solutionExplain: 'Parse once, loop over orders, total each order\'s items with a comprehension, and accumulate both the overall revenue and a per-customer dict. `summary_json` reuses `summarize` and serializes the result — data in, data out.',
      hints: [
        'Parse with `json.loads`, then loop `for order in data["orders"]`. Each order total is `sum([item["price"] * item["qty"] for item in order["items"]])`.',
        'Use the counting pattern for `by_customer` (adding totals). Build and return the result dict; `summary_json` is one line with `json.dumps(..., sort_keys=True)`.',
      ],
      tests: [
        call('summarize', [ORDERS], { store: 'Code Café', order_count: 3, revenue: 11.25, by_customer: { Ada: 9.25, Alan: 2.0 } }, 'Revenue: 7.00 + 2.25 + 2.00 = 11.25. Ada: 9.25, Alan: 2.0.'),
        call('summarize', ['{"store": "Empty", "orders": []}'], { store: 'Empty', order_count: 0, revenue: 0, by_customer: {} }, 'No orders → zeros and an empty dict.'),
        check('summary_json', `out = summary_json(${JSON.stringify(ORDERS)})\nimport json as _j\nassert isinstance(out, str), 'Return a string'\nassert _j.loads(out)['revenue'] == 11.25\nassert out.index('"by_customer"') < out.index('"order_count"') < out.index('"revenue"') < out.index('"store"'), 'Keys should be sorted'`, 'Return JSON text with sorted keys.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'bug',
      prompt: 'Why does `json.loads` reject this?',
      code: "{'name': 'Ada', 'age': 36}",
      codeLang: 'python',
      options: ['Numbers aren\'t allowed', 'JSON requires double quotes', 'It needs square brackets', 'Keys must be numbers'],
      answer: 1,
      explain: 'JSON strings and keys must use double quotes. Single quotes are Python, not JSON.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'import json\nprint(json.loads("[true, null, 1.5]"))',
      answers: ['[True, None, 1.5]'],
      explain: 'JSON true/null become Python True/None.',
    },
    {
      kind: 'concept',
      prompt: 'What does `JSON.stringify({a: 1})` return in JS?',
      options: ['An object', 'The string \'{"a":1}\'', 'undefined', '1'],
      answer: 1,
      explain: 'stringify serializes data into JSON text.',
    },
  ],
});
