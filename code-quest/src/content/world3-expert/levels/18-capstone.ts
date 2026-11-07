import { call, check, code, defineLevel, query, rows } from '../../dsl';

const RAW = [
  { id: 1, region: 'North', month: '2026-01', amount: 1200 },
  { id: 2, region: 'South', month: '2026-01', amount: 800 },
  { id: 3, region: 'North', month: '2026-02', amount: 1500 },
  { id: 4, region: 'South', month: '2026-02', amount: 'oops' },
  { id: 5, region: 'East', month: '2026-02', amount: 650 },
  { id: 6, month: '2026-03', amount: 400 },
  { id: 7, region: 'South', month: '2026-03', amount: 1100 },
  { id: 8, region: 'North', month: '2026-03', amount: 950 },
  { id: 9, region: 'East', month: '2026-03', amount: -50 },
];
const SALES_JSON = JSON.stringify(RAW);
const VALID = RAW.filter((r) => typeof r.amount === 'number' && r.amount >= 0 && typeof r.region === 'string');

const CREATE = 'CREATE TABLE sales (id INTEGER PRIMARY KEY, region TEXT, month TEXT, amount REAL);';
const INSERTS = `INSERT INTO sales VALUES\n${VALID.map((r) => `  (${r.id}, '${r.region}', '${r.month}', ${r.amount})`).join(',\n')};`;
const SALES_DB = `${CREATE}\n${INSERTS}\n`;

const STEP1 = code`
  const salesJson = ${'`'}${SALES_JSON}${'`'};

  function isValid(record) {
    return (
      typeof record.region === "string" &&
      typeof record.month === "string" &&
      typeof record.amount === "number" &&
      record.amount >= 0
    );
  }

  function parseSales(jsonText) {
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (err) {
      return [];
    }
    if (!Array.isArray(data)) return [];
    return data.filter(isValid);
  }

  console.log(parseSales(salesJson).length, "valid records");
`;

const ANALYZE = code`
  def analyze(monthly):
      if not monthly:
          return {"total": 0, "best_month": None, "worst_month": None, "growth": {}}
      total = round(sum([t for _, t in monthly]), 2)
      best = max(monthly, key=lambda row: row[1])[0]
      worst = min(monthly, key=lambda row: row[1])[0]
      growth = {}
      for i in range(1, len(monthly)):
          prev = monthly[i - 1][1]
          month, current = monthly[i]
          growth[month] = round((current - prev) / prev * 100, 1)
      return {"total": total, "best_month": best, "worst_month": worst, "growth": growth}
`;

const DASH_HTML = `<h2>📊 Sales Dashboard</h2>
<p id="headline"></p>
<table id="regions" border="1" cellpadding="4">
  <thead><tr><th>Region</th><th>Total</th></tr></thead>
  <tbody></tbody>
</table>
<div id="bars" style="margin-top:12px"></div>`;

const DASH_DATA = code`
  // Results from your SQL and Python steps:
  const regions = [
    { region: "North", total: 3650 },
    { region: "South", total: 1900 },
    { region: "East", total: 650 },
  ];
  const summary = { total: 6200, best_month: "2026-02", worst_month: "2026-01" };
`;

const DASH = `${DASH_DATA}
function renderDashboard(regions, summary) {
  document.querySelector("#headline").textContent =
    \`Total sales: \${summary.total} · Best month: \${summary.best_month}\`;

  const tbody = document.querySelector("#regions tbody");
  tbody.innerHTML = "";
  for (const r of regions) {
    const row = document.createElement("tr");
    const name = document.createElement("td");
    const total = document.createElement("td");
    name.textContent = r.region;
    total.textContent = r.total;
    row.appendChild(name);
    row.appendChild(total);
    tbody.appendChild(row);
  }

  const max = Math.max(...regions.map((r) => r.total));
  const bars = document.querySelector("#bars");
  bars.innerHTML = "";
  for (const r of regions) {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.textContent = r.region;
    bar.style.width = \`\${Math.round((r.total / max) * 100)}%\`;
    bar.style.background = "#8b6cff";
    bar.style.color = "white";
    bar.style.margin = "4px 0";
    bars.appendChild(bar);
  }
}

renderDashboard(regions, summary);
`;

export default defineLevel({
  id: 'w3.boss',
  title: 'Capstone: Data Dashboard',
  kind: 'boss',
  icon: '👑',
  summary: 'FINAL BOSS: JSON → SQL → Python → JS dashboard',
  lang: 'javascript',
  teaches: [],
  requires: ['json', 'sql-write', 'sql-aggregate', 'dom', 'comprehensions', 'sorting', 'testing'],
  learn: [
    {
      title: 'Boss briefing: the data pipeline',
      minutes: 4,
      analogy: 'A **factory line**: raw material comes in messy, gets inspected, stored in the warehouse, analyzed by the accountants, and finally displayed in the shop window. Each station uses the best tool for its job.',
      body: `Real projects combine languages, each where it's strongest. You'll build a sales **pipeline** — data flowing through stages:

1. **JavaScript** — parse raw JSON from an API and reject bad records.
2. **SQL** — create a table and store the clean data.
3. **SQL** — summarize it: sales per month.
4. **Python** — analyze the monthly numbers: best/worst month and growth %.
5. **JavaScript** — render a dashboard: table, headline and bar chart.

\`\`\`
raw JSON → [JS clean] → [SQL store] → [SQL summarize] → [Python analyze] → [JS display]
\`\`\`

The data includes deliberately broken records (a text amount, a missing region, a negative sale). Everything you've learned comes together here. Good luck! 👑`,
      example: {
        lang: 'javascript',
        code: `const raw = ${'`'}[{"region": "North", "amount": 10}, {"amount": "oops"}]${'`'};\nconst data = JSON.parse(raw);\nconst clean = data.filter(r => typeof r.amount === "number");\nconsole.log(clean);\n`,
      },
    },
  ],
  challenges: [
    {
      title: 'Step 1 (JS): Clean the raw JSON',
      minutes: 7,
      prompt: `The API sends sales as JSON text (in \`salesJson\`). Write \`parseSales(jsonText)\` that returns an array of **valid** records only. A record is valid when:

- \`region\` and \`month\` are strings (\`typeof x === "string"\`)
- \`amount\` is a number (\`typeof\`) and is **not negative**

If the text isn't valid JSON, or isn't an array (\`Array.isArray\`), return \`[]\`. A helper \`isValid(record)\` keeps it tidy.

The sample data has 9 records; 6 are valid.`,
      starter: `const salesJson = ${'`'}${SALES_JSON}${'`'};\n\nfunction parseSales(jsonText) {\n}\n\nconsole.log(parseSales(salesJson));\n`,
      solution: STEP1,
      solutionExplain: '`JSON.parse` inside try/catch handles broken text. `filter(isValid)` keeps records passing every rule — the predicate function is passed by name. Validating at the entrance means every later stage can trust the data.',
      hints: [
        'Parse inside `try { ... } catch (err) { return []; }`. Then `if (!Array.isArray(data)) return [];` and `return data.filter(isValid);`.',
        '`isValid`: `typeof record.region === "string" && typeof record.month === "string" && typeof record.amount === "number" && record.amount >= 0`.',
      ],
      tests: [
        call('parseSales', [SALES_JSON], VALID, 'Keep the 6 valid records (ids 1, 2, 3, 5, 7, 8) — drop "oops", the missing region and the negative amount.'),
        call('parseSales', ['not json'], [], 'Invalid JSON → [].'),
        call('parseSales', ['{"region": "North"}'], [], 'Not an array → [].'),
        call('parseSales', ['[{"region": "W", "month": "2026-04", "amount": 0}]'], [{ region: 'W', month: '2026-04', amount: 0 }], 'An amount of 0 is allowed (not negative).'),
      ],
    },
    {
      title: 'Step 2 (SQL): Store the clean data',
      lang: 'sql',
      minutes: 5,
      prompt: `Create a table \`sales\` with columns \`id\` (INTEGER PRIMARY KEY), \`region\` (TEXT), \`month\` (TEXT) and \`amount\` (REAL). Insert the 6 clean records from Step 1:

| id | region | month | amount |
|---|---|---|---|
${VALID.map((r) => `| ${r.id} | ${r.region} | ${r.month} | ${r.amount} |`).join('\n')}

Finish with \`SELECT COUNT(*), SUM(amount) FROM sales;\` to check your work.`,
      starter: '-- 1. CREATE TABLE\n\n-- 2. INSERT the 6 rows\n\n-- 3. Check\nSELECT COUNT(*), SUM(amount) FROM sales;\n',
      solution: `${SALES_DB}SELECT COUNT(*), SUM(amount) FROM sales;\n`,
      solutionExplain: 'One INSERT can add many rows, separated by commas. The final SELECT confirms 6 rows totalling 6200.',
      hints: [
        '`CREATE TABLE sales (id INTEGER PRIMARY KEY, region TEXT, month TEXT, amount REAL);`',
        "`INSERT INTO sales VALUES (1, 'North', '2026-01', 1200), (2, 'South', '2026-01', 800), ...;`",
      ],
      tests: [
        rows('6 rows totalling 6200', [[6, 6200]], 'Insert all 6 clean rows exactly.'),
        query('Correct columns and values', "SELECT id, region, month, amount FROM sales ORDER BY id", VALID.map((r) => [r.id, r.region as string, r.month, r.amount as number]), 'Check every id, region, month and amount.', true),
      ],
    },
    {
      title: 'Step 3 (SQL): Monthly summary',
      lang: 'sql',
      minutes: 4,
      prompt: 'The table from Step 2 is ready. Write one query returning `month`, the total `amount` as `total`, and the number of sales as `sales`, one row per month, in month order.',
      starter: 'SELECT * FROM sales;\n',
      sqlSetup: SALES_DB,
      solution: 'SELECT month, SUM(amount) AS total, COUNT(*) AS sales\nFROM sales\nGROUP BY month\nORDER BY month;\n',
      solutionExplain: 'GROUP BY month with two aggregates gives one summary row per month — exactly what the analysis step needs.',
      hints: ['GROUP BY month, with SUM(amount) and COUNT(*).', '`SELECT month, SUM(amount) AS total, COUNT(*) AS sales FROM sales GROUP BY month ORDER BY month;`'],
      tests: [rows('Monthly totals', [['2026-01', 2000, 2], ['2026-02', 2150, 2], ['2026-03', 2050, 2]], 'One row per month: month, total, number of sales.', true)],
    },
    {
      title: 'Step 4 (Python): Analyze the months',
      lang: 'python',
      minutes: 7,
      prompt: `Python gets the SQL result as a list of \`[month, total]\` pairs:

\`\`\`python
monthly = [["2026-01", 2000], ["2026-02", 2150], ["2026-03", 2050]]
\`\`\`

Write \`analyze(monthly)\` returning a dict:
- \`"total"\`: sum of all totals
- \`"best_month"\` / \`"worst_month"\`: month with the highest / lowest total
- \`"growth"\`: dict from each month (except the first) to its % change vs the previous month, rounded to 1 decimal: \`(current - previous) / previous * 100\`

\`analyze(monthly)\` → \`{"total": 6200, "best_month": "2026-02", "worst_month": "2026-01", "growth": {"2026-02": 7.5, "2026-03": -4.7}}\`

For an empty list return \`{"total": 0, "best_month": None, "worst_month": None, "growth": {}}\`.`,
      starter: 'def analyze(monthly):\n    pass\n',
      solution: ANALYZE,
      solutionExplain: '`max`/`min` with a `key` find the best/worst rows; `[0]` takes the month. The growth loop starts at index 1 so each month compares with the one before. `for _, t in monthly` unpacks pairs; `_` is the conventional name for a value you don\'t need.',
      hints: [
        'Handle the empty list first (guard clause). For best/worst: `max(monthly, key=lambda row: row[1])[0]`.',
        'Growth: `for i in range(1, len(monthly)):` compare `monthly[i][1]` with `monthly[i - 1][1]` and round to 1 decimal.',
      ],
      tests: [
        call('analyze', [[['2026-01', 2000], ['2026-02', 2150], ['2026-03', 2050]]], { total: 6200, best_month: '2026-02', worst_month: '2026-01', growth: { '2026-02': 7.5, '2026-03': -4.7 } }, 'February grew 7.5%; March dropped 4.7%.'),
        call('analyze', [[['2026-05', 100]]], { total: 100, best_month: '2026-05', worst_month: '2026-05', growth: {} }, 'One month: no growth figures.'),
        call('analyze', [[]], { total: 0, best_month: null, worst_month: null, growth: {} }, 'Empty input → zeros and None.'),
      ],
    },
    {
      title: 'Step 5 (JS): Render the dashboard',
      minutes: 9,
      prompt: `Final step! Write \`renderDashboard(regions, summary)\` for this page:

\`\`\`html
${DASH_HTML}
\`\`\`

1. \`#headline\` text: \`Total sales: 6200 · Best month: 2026-02\` (from \`summary\`).
2. \`#regions tbody\`: one \`<tr>\` per region with two \`<td>\` cells — region and total.
3. \`#bars\`: one \`<div class="bar">\` per region, text = region name, \`style.width\` = its total as a **percentage of the largest total**, rounded (\`"100%"\`, \`"52%"\`, \`"18%"\`).

Call it once with the provided data. \`Math.max(...numbers)\` gives the largest of an array (the \`...\` spreads the array out).`,
      starter: `${DASH_DATA}\nfunction renderDashboard(regions, summary) {\n  // your code\n}\n\nrenderDashboard(regions, summary);\n`,
      dom: { html: DASH_HTML },
      solution: DASH,
      solutionExplain: 'Three independent parts, each clearing its container then building elements from data — the same render pattern as World 2\'s boss. Bar widths scale every total against the largest, so the biggest region fills 100%. You just built a full pipeline across three languages. 👑',
      hints: [
        'Headline: a template literal into `#headline`. Table: for each region create `tr` + two `td`s and append to `document.querySelector("#regions tbody")`.',
        'Bars: `const max = Math.max(...regions.map(r => r.total));` then for each region a `div` with `className = "bar"` and `style.width = `${Math.round(r.total / max * 100)}%``.',
      ],
      tests: [
        check('Headline', "assert(textOf('#headline') === 'Total sales: 6200 · Best month: 2026-02', 'Headline: ' + textOf('#headline'));", 'Use the summary values in the exact format shown.'),
        check('Table rows', "const rows = [...document.querySelectorAll('#regions tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent.trim()));\nassert(JSON.stringify(rows) === JSON.stringify([['North', '3650'], ['South', '1900'], ['East', '650']]), 'Rows: ' + JSON.stringify(rows));", 'One row per region with region and total cells, in the given order.'),
        check('Bar widths', "const bars = [...document.querySelectorAll('#bars .bar')];\nconst got = bars.map(b => b.textContent.trim() + ' ' + b.style.width);\nassert(JSON.stringify(got) === JSON.stringify(['North 100%', 'South 52%', 'East 18%']), 'Bars: ' + JSON.stringify(got));", 'Widths relative to the largest total: 100%, 52%, 18%.'),
        check('Re-render is clean', "renderDashboard([{ region: 'Solo', total: 5 }], { total: 5, best_month: '2026-09' });\nassert(document.querySelectorAll('#regions tbody tr').length === 1, 'Old rows were not cleared');\nassert(document.querySelectorAll('#bars .bar').length === 1, 'Old bars were not cleared');\nassert(textOf('#headline') === 'Total sales: 5 · Best month: 2026-09');", 'Calling renderDashboard again must replace, not append.'),
      ],
    },
  ],
  quiz: [],
});
