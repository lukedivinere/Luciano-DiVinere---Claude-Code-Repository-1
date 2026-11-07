import { call, check, code, defineLevel } from '../../dsl';

// A pretend web API the exercises talk to. Real code would use the
// `requests` library or fetch(); this mock behaves the same way offline.
const MOCK = code`
  # --- Mock API (pretends to be the internet; don't edit) ---------------
  import json

  _USERS = [{"id": i, "name": n} for i, n in enumerate(
      ["Ada", "Alan", "Grace", "Linus", "Margaret", "Tim", "Barbara"], start=1)]

  def fake_get(url):
      """Returns a response dict: {"status": int, "body": json text}."""
      if url.startswith("/users/"):
          uid = url.split("/")[2]
          for u in _USERS:
              if str(u["id"]) == uid:
                  return {"status": 200, "body": json.dumps(u)}
          return {"status": 404, "body": json.dumps({"error": "not found"})}
      if url.startswith("/users?page="):
          page = int(url.split("=")[1])
          chunk = _USERS[(page - 1) * 3: page * 3]
          nxt = page + 1 if page * 3 < len(_USERS) else None
          return {"status": 200, "body": json.dumps({"users": chunk, "next_page": nxt})}
      return {"status": 404, "body": json.dumps({"error": "unknown endpoint"})}
  # ------------------------------------------------------------------------
`;

export default defineLevel({
  id: 'w3.l8',
  title: 'APIs (mocked)',
  icon: '🛰️',
  summary: 'Requests, responses, status codes, pagination',
  lang: 'python',
  teaches: ['apis'],
  requires: ['json', 'try-except', 'while-loop', 'functions', 'dicts'],
  learn: [
    {
      title: 'Talking to other programs',
      minutes: 3,
      analogy: 'An API is a **restaurant menu and waiter**: you don\'t go into the kitchen — you place an order in an agreed format, and the waiter brings back a response.',
      body: `An **API** (Application Programming Interface) is a set of rules for programs to talk to each other. **Web APIs** work over HTTP, the same protocol as web pages:

1. Your code sends a **request** to a **URL** (an "endpoint"), with a **method**: \`GET\` (read), \`POST\` (create), \`PUT\` (update), \`DELETE\`.
2. The server sends a **response**: a **status code** and a **body**, usually JSON.

Common status codes: **200** OK · **201** Created · **400** Bad request · **401** Not logged in · **404** Not found · **500** Server error.

Here we use \`fake_get(url)\`, which behaves like a real API but works offline (real Python code would use the \`requests\` library). It returns \`{"status": ..., "body": "...json..."}\`.`,
      example: {
        lang: 'python',
        code: `${MOCK}\nres = fake_get("/users/1")\nprint(res["status"], res["body"])\nuser = json.loads(res["body"])\nprint("Hello,", user["name"])\n\nmissing = fake_get("/users/99")\nprint(missing["status"], json.loads(missing["body"]))\n`,
      },
    },
    {
      title: 'Pagination',
      minutes: 2,
      analogy: 'A search engine shows results **one page at a time**. To see everything you keep clicking "next" until there is no next page.',
      body: `APIs rarely return thousands of records at once. They split results into **pages**, and each response says how to get the next one:

\`\`\`json
{"users": [...3 users...], "next_page": 2}
\`\`\`

When \`next_page\` is \`null\` (Python \`None\`) you've reached the end. The pattern is a while loop:

\`\`\`python
page = 1
while page is not None:
    data = json.loads(fake_get(f"/users?page={page}")["body"])
    ...collect data["users"]...
    page = data["next_page"]
\`\`\`

\`is not None\` is the recommended way to compare with None.`,
      example: {
        lang: 'python',
        code: `${MOCK}\npage = 1\nwhile page is not None:\n    data = json.loads(fake_get(f"/users?page={page}")["body"])\n    print("page", page, [u["name"] for u in data["users"]])\n    page = data["next_page"]\n`,
      },
    },
  ],
  practice: [
    {
      title: 'Get a user\'s name',
      minutes: 2,
      prompt: 'Write `user_name(user_id)` that requests `/users/ID` and returns the user\'s name, or `None` if the status isn\'t 200.',
      starter: `${MOCK}\n\ndef user_name(user_id):\n    pass\n`,
      solution: `${MOCK}\n\ndef user_name(user_id):\n    res = fake_get(f"/users/{user_id}")\n    if res["status"] != 200:\n        return None\n    return json.loads(res["body"])["name"]\n`,
      solutionExplain: 'Always check the status before trusting the body: a 404 body is an error message, not a user.',
      hints: ['`res = fake_get(f"/users/{user_id}")` and check `res["status"]`.', 'On 200: `json.loads(res["body"])["name"]`.'],
      tests: [call('user_name', [3], 'Grace', 'User 3 is Grace.'), call('user_name', [99], null, '404 → None.')],
    },

    {
      title: 'Explain the status code',
      minutes: 2,
      prompt: 'Write `describe_status(code)` returning `"OK"` (200), `"Created"` (201), `"Not found"` (404), `"Server error"` (500), or `"Unknown"` for anything else. Use a dict, not a chain of ifs.',
      starter: 'def describe_status(code):\n    pass\n',
      solution: 'STATUS_TEXT = {200: "OK", 201: "Created", 404: "Not found", 500: "Server error"}\n\n\ndef describe_status(code):\n    return STATUS_TEXT.get(code, "Unknown")\n',
      solutionExplain: 'A lookup table plus `.get(..., default)` replaces a long if/elif chain — and adding a new code is one line.',
      hints: ['Make a dict from code numbers to text.', '`return STATUS_TEXT.get(code, "Unknown")`'],
      tests: [
        call('describe_status', [404], 'Not found', '404 → Not found'),
        call('describe_status', [201], 'Created', '201 → Created'),
        call('describe_status', [418], 'Unknown', 'Anything else → Unknown'),
        check('Uses a dict', "assert '{' in CODE and 'elif' not in CODE", 'Use a dict lookup instead of if/elif.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Collect every page',
      minutes: 7,
      prompt: `Write two functions using \`fake_get\`:

**1. \`all_users()\`** — follow the pagination from page 1 until \`next_page\` is \`None\`, and return the list of **all names** in order.

**2. \`fetch_users(ids)\`** — for each id, request \`/users/ID\`. Return a dict with:
- \`"found"\`: list of names for ids that returned 200, in order
- \`"missing"\`: list of ids that returned 404

\`fetch_users([1, 42, 2])\` → \`{"found": ["Ada", "Alan"], "missing": [42]}\``,
      starter: `${MOCK}\n\ndef all_users():\n    pass\n\n\ndef fetch_users(ids):\n    pass\n`,
      solution: `${MOCK}\n\ndef all_users():\n    names = []\n    page = 1\n    while page is not None:\n        data = json.loads(fake_get(f"/users?page={page}")["body"])\n        names += [u["name"] for u in data["users"]]\n        page = data["next_page"]\n    return names\n\n\ndef fetch_users(ids):\n    result = {"found": [], "missing": []}\n    for uid in ids:\n        res = fake_get(f"/users/{uid}")\n        if res["status"] == 200:\n            result["found"].append(json.loads(res["body"])["name"])\n        else:\n            result["missing"].append(uid)\n    return result\n`,
      solutionExplain: '`all_users` keeps requesting pages, adding each page\'s names, until the API says there\'s no next page. `fetch_users` branches on each response\'s status code.',
      hints: [
        '`all_users`: the while loop from the lesson; add each page\'s names to a list (`names += [...]` adds a whole list).',
        '`fetch_users`: start `{"found": [], "missing": []}`; for each id, check `res["status"] == 200`.',
      ],
      tests: [
        call('all_users', [], ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Tim', 'Barbara'], 'All 7 users across 3 pages, in order.'),
        call('fetch_users', [[1, 42, 2]], { found: ['Ada', 'Alan'], missing: [42] }, 'Ids 1 and 2 exist; 42 is a 404.'),
        call('fetch_users', [[]], { found: [], missing: [] }, 'No ids → empty lists.'),
        check('Uses the API', "assert 'fake_get(' in CODE.split('def all_users')[1], 'Call fake_get'\nassert 'Barbara' not in CODE.split('def all_users')[1], 'Do not hard-code names'", 'Get the data from the API — don\'t hard-code names.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'What does this print?',
      code: 'import json\nres = {"status": 404, "body": \'{"error": "not found"}\'}\nif res["status"] != 200:\n    print(json.loads(res["body"])["error"])',
      answers: ['not found'],
      explain: 'The status isn\'t 200, so we parse the error body and print its message.',
    },
    {
      kind: 'concept',
      prompt: 'What does status code 404 mean?',
      options: ['Success', 'Not found', 'Server crashed', 'Created'],
      answer: 1,
      explain: '404 = the resource doesn\'t exist.',
    },
    {
      kind: 'bug',
      prompt: 'This sometimes crashes with KeyError: \'name\'. Why?',
      code: 'res = fake_get(f"/users/{uid}")\nprint(json.loads(res["body"])["name"])',
      options: ['json.loads is wrong', 'It never checks the status; a 404 body has no "name"', 'uid must be a string', 'print can\'t print names'],
      answer: 1,
      explain: 'Check `res["status"] == 200` before reading the body as a user.',
    },
    {
      kind: 'concept',
      prompt: 'Which HTTP method is used to CREATE a new record?',
      options: ['GET', 'POST', 'DELETE', 'PEEK'],
      answer: 1,
      explain: 'POST creates; GET reads; PUT updates; DELETE removes.',
    },
  ],
});
