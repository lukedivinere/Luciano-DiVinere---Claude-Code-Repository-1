import { check, code, defineLevel } from '../../dsl';

const HTML = `<h2>💰 Budget</h2>
<form id="form">
  <input id="desc" placeholder="Description">
  <input id="amount" placeholder="Amount (negative = expense)">
  <select id="category"><option>food</option><option>home</option><option>fun</option><option>job</option></select>
  <button id="add" type="submit">Add</button>
</form>
<p id="error" style="color:#c00"></p>
<ul id="list"></ul>
<p>Balance: <strong id="balance">0</strong></p>
<div id="totals"></div>`;

const DATA = 'const transactions = [\n  { desc: "Salary", amount: 1200, category: "job" },\n  { desc: "Rent", amount: -800, category: "home" },\n];\n';

const s1 = code`
  const transactions = [
    { desc: "Salary", amount: 1200, category: "job" },
    { desc: "Rent", amount: -800, category: "home" },
  ];

  const list = document.querySelector("#list");
  const balanceEl = document.querySelector("#balance");

  function render() {
    list.innerHTML = "";
    for (const t of transactions) {
      const li = document.createElement("li");
      li.textContent = \`\${t.desc}: \${t.amount} (\${t.category})\`;
      list.appendChild(li);
    }
    balanceEl.textContent = transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  render();
`;

const s2 = s1.replace(
  'render();\n',
  code`
    const form = document.querySelector("#form");
    const descInput = document.querySelector("#desc");
    const amountInput = document.querySelector("#amount");
    const errorEl = document.querySelector("#error");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const desc = descInput.value.trim();
      const amount = Number(amountInput.value);
      if (desc === "" || Number.isNaN(amount) || amount === 0) {
        errorEl.textContent = "Please enter a description and a non-zero amount.";
        return;
      }
      transactions.push({ desc, amount, category: document.querySelector("#category").value });
      errorEl.textContent = "";
      descInput.value = "";
      amountInput.value = "";
      render();
    });

    render();
  `,
);

const s3 = s2.replace(
  `function render() {
  list.innerHTML = "";
  for (const t of transactions) {
    const li = document.createElement("li");
    li.textContent = \`\${t.desc}: \${t.amount} (\${t.category})\`;
    list.appendChild(li);
  }
  balanceEl.textContent = transactions.reduce((sum, t) => sum + t.amount, 0);
}`,
  `function render() {
  list.innerHTML = "";
  for (const t of transactions) {
    const li = document.createElement("li");
    li.textContent = \`\${t.desc}: \${t.amount} (\${t.category})\`;
    list.appendChild(li);
  }
  balanceEl.textContent = transactions.reduce((sum, t) => sum + t.amount, 0);

  const totals = {};
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }
  totalsEl.innerHTML = "";
  for (const category of Object.keys(totals).sort()) {
    const p = document.createElement("p");
    p.textContent = \`\${category}: \${totals[category]}\`;
    totalsEl.appendChild(p);
  }
}`,
).replace('const balanceEl = document.querySelector("#balance");', 'const balanceEl = document.querySelector("#balance");\nconst totalsEl = document.querySelector("#totals");');

const items = "[...document.querySelectorAll('#list li')].map(li => li.textContent.trim())";
const add = (d: string, a: string, c: string) => `typeInto('#desc', '${d}'); typeInto('#amount', '${a}'); typeInto('#category', '${c}'); submitForm('#form');`;

export default defineLevel({
  id: 'w2.bossB',
  title: 'Budget Web Page (JS)',
  kind: 'boss',
  icon: '🌐',
  summary: 'BOSS part B: an interactive budget page in JavaScript',
  lang: 'javascript',
  teaches: [],
  requires: ['dom', 'events', 'js-objects', 'js-arrays', 'js-functions'],
  learn: [
    {
      title: 'Boss briefing: the budget page',
      minutes: 3,
      analogy: 'Part A built the **engine**; now you build the **dashboard** — the part people actually see and click.',
      body: `The same budget idea, as a real interactive web page. Your data is an **array of objects** — the JS twin of Part A's list of Transactions:

\`\`\`js
{ desc: "Rent", amount: -800, category: "home" }
\`\`\`

A powerful pattern for UIs: keep the **data** in one place, and write a single \`render()\` function that rebuilds the page from that data. After any change, update the data and call \`render()\` again — the page can never get out of sync.

Steps:
1. Render the list and balance.
2. Add transactions with a form (with validation).
3. Show totals per category.

Two new tools: \`list.innerHTML = ""\` empties an element, and \`Number("12.5")\` converts text to a number (\`NaN\` — "not a number" — if it can't).`,
      example: {
        lang: 'javascript',
        dom: { html: '<ul id="list"></ul><p id="total"></p>' },
        code: code`
          const items = [{ name: "Tea", price: 3 }, { name: "Cake", price: 4 }];
          function render() {
            const list = document.querySelector("#list");
            list.innerHTML = "";
            for (const item of items) {
              const li = document.createElement("li");
              li.textContent = \`\${item.name}: $\${item.price}\`;
              list.appendChild(li);
            }
            document.querySelector("#total").textContent = "Total: $" + items.reduce((s, i) => s + i.price, 0);
          }
          render();
        `,
      },
    },
  ],
  challenges: [
    {
      title: 'Step 1: Render the list',
      minutes: 5,
      prompt: `Write a \`render()\` function that:

- empties \`#list\`, then adds one \`<li>\` per transaction with text \`DESC: AMOUNT (CATEGORY)\`, e.g. \`Rent: -800 (home)\`
- sets \`#balance\` to the sum of all amounts

Call \`render()\` once at the end. Page:

\`\`\`html
${HTML}
\`\`\``,
      starter: `${DATA}\n// Step 1: write render() and call it\n`,
      dom: { html: HTML },
      solution: s1,
      solutionExplain: '`render` rebuilds the list from the array every time: clear it, then create one `<li>` per object. `reduce` sums the amounts for the balance.',
      hints: [
        'Inside `render`: `list.innerHTML = "";` then `for (const t of transactions)` create an `li`, set its `textContent`, `appendChild`.',
        'Balance: `transactions.reduce((sum, t) => sum + t.amount, 0)`. Don\'t forget to call `render();` at the bottom.',
      ],
      tests: [
        check('Lists both transactions', `const got = ${items};\nassert(JSON.stringify(got) === JSON.stringify(['Salary: 1200 (job)', 'Rent: -800 (home)']), 'List shows: ' + JSON.stringify(got));`, 'One <li> per transaction, formatted "Desc: amount (category)".'),
        check('Balance is 400', "assert(textOf('#balance') === '400', 'Balance shows: ' + textOf('#balance'));", '1200 − 800 = 400.'),
        check('render() re-renders without duplicates', `transactions.push({ desc: 'Tea', amount: -3, category: 'food' }); render(); render();\nconst got = ${items};\nassert(got.length === 3, 'Expected 3 items after calling render twice, got ' + got.length);\nassert(textOf('#balance') === '397', 'Balance: ' + textOf('#balance'));`, 'render() must clear the list first, so calling it twice doesn\'t duplicate items.'),
      ],
    },
    {
      title: 'Step 2: Add with a form',
      minutes: 6,
      prompt: `Handle the form's \`submit\` event:

1. Call \`event.preventDefault()\` (stops the browser reloading the page).
2. Read \`#desc\` (trimmed) and \`Number(#amount)\`.
3. If the description is empty, the amount is \`NaN\` (check with \`Number.isNaN(amount)\`) or the amount is 0: show \`Please enter a description and a non-zero amount.\` in \`#error\` and stop.
4. Otherwise push \`{ desc, amount, category }\` (category from \`#category\`), clear \`#error\` and both inputs, and \`render()\`.`,
      starter: s1.replace('render();\n', '// Step 2: handle the form submit\n\nrender();\n'),
      dom: { html: HTML },
      solution: s2,
      solutionExplain: 'The submit handler validates first and returns early on bad input — the same "check before changing state" rule as the Python classes. Valid input updates the data array, then `render()` redraws everything.',
      hints: [
        '`form.addEventListener("submit", (event) => { event.preventDefault(); ... })`. Read values with `.value`.',
        'Validation: `if (desc === "" || Number.isNaN(amount) || amount === 0) { errorEl.textContent = "..."; return; }`. Then push, clear, render.',
      ],
      tests: [
        check('Adds a valid transaction', `${add('Coffee', '-3.5', 'food')}\nconst got = ${items};\nassert(got.includes('Coffee: -3.5 (food)'), 'List: ' + JSON.stringify(got));\nassert(textOf('#balance') === '396.5', 'Balance: ' + textOf('#balance'));`, 'Submitting Coffee / -3.5 / food adds it and updates the balance to 396.5.'),
        check('Clears inputs', "assert(document.querySelector('#desc').value === '' && document.querySelector('#amount').value === '', 'Inputs were not cleared');", 'After a successful add, both inputs are empty.'),
        check('Rejects bad input', `${add('', '5', 'fun')}\nassert(textOf('#error') === 'Please enter a description and a non-zero amount.', 'Error shows: ' + textOf('#error'));\n${add('Snack', 'abc', 'food')}\n${add('Nothing', '0', 'food')}\nassert(${items}.length === 3, 'Bad input was added');`, 'Empty description, non-numbers and 0 must show the error and add nothing.'),
        check('Error clears after a good add', `${add('Pizza', '-10', 'fun')}\nassert(textOf('#error') === '', 'Error still shows: ' + textOf('#error'));`, 'A valid add clears the error message.'),
      ],
    },
    {
      title: 'Step 3: Category totals',
      minutes: 5,
      prompt: `Extend \`render()\` so \`#totals\` shows one \`<p>\` per category, **sorted alphabetically**, like \`home: -800\`.

Use the counting pattern with \`??\`, and \`Object.keys(totals).sort()\` for alphabetical order. Remember to empty \`#totals\` first.`,
      starter: s2.replace('  balanceEl.textContent', '  // Step 3: also render category totals into #totals\n  balanceEl.textContent'),
      dom: { html: HTML },
      solution: s3,
      solutionExplain: 'Totals are computed from the data on every render, so they\'re always correct after adds. Sorting the keys gives a stable, alphabetical order.',
      hints: [
        'Build `totals` with `totals[t.category] = (totals[t.category] ?? 0) + t.amount;` inside render.',
        'Then `totalsEl.innerHTML = "";` and for each `category of Object.keys(totals).sort()` append a `<p>` with `${category}: ${totals[category]}`.',
      ],
      tests: [
        check('Initial totals', "const got = [...document.querySelectorAll('#totals p')].map(p => p.textContent.trim());\nassert(JSON.stringify(got) === JSON.stringify(['home: -800', 'job: 1200']), 'Totals: ' + JSON.stringify(got));", 'Alphabetical: home then job.'),
        check('Totals update after adds', `${add('Tea', '-3', 'food')}\n${add('Cake', '-4', 'food')}\nconst got = [...document.querySelectorAll('#totals p')].map(p => p.textContent.trim());\nassert(JSON.stringify(got) === JSON.stringify(['food: -7', 'home: -800', 'job: 1200']), 'Totals: ' + JSON.stringify(got));`, 'Adding two food items should show food: -7, sorted first.'),
        check('List and balance still work', `assert(${items}.length === 4, 'Expected 4 items');\nassert(textOf('#balance') === '393', 'Balance: ' + textOf('#balance'));`, 'Steps 1 and 2 must keep working.'),
      ],
    },
  ],
  quiz: [],
});
