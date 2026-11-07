import { code, defineLevel, rows } from '../../dsl';
import { SANDBOX_DB as DB } from '../../sandboxDb';

export default defineLevel({
  id: 'w3.l12',
  title: 'SQL: GROUP BY',
  icon: '📊',
  summary: 'COUNT, SUM, AVG, GROUP BY and HAVING',
  lang: 'sql',
  teaches: ['sql-aggregate'],
  requires: ['sql-select', 'dicts'],
  learn: [
    {
      title: 'Summaries with aggregates',
      minutes: 3,
      analogy: 'GROUP BY is **sorting a pile of receipts into envelopes by month**, then writing the total on each envelope.',
      body: `**Aggregate functions** squash many rows into one value: \`COUNT(*)\`, \`SUM(col)\`, \`AVG(col)\`, \`MIN(col)\`, \`MAX(col)\`.

\`GROUP BY\` splits rows into groups first, and the aggregates run **per group**:

\`\`\`sql
SELECT category, COUNT(*) AS how_many, MAX(price) AS top_price
FROM products
GROUP BY category;
\`\`\`

\`AS\` gives a result column a nicer name (an **alias**).

Filtering **groups** uses \`HAVING\` (WHERE filters rows *before* grouping; HAVING filters groups *after*):

\`\`\`sql
... GROUP BY category HAVING COUNT(*) >= 3;
\`\`\`

It's the dict counting pattern from World 2 — in one statement.`,
      example: {
        lang: 'sql',
        sqlSetup: DB,
        code: code`
          SELECT category, COUNT(*) AS how_many, MAX(price) AS top_price
          FROM products
          GROUP BY category
          ORDER BY how_many DESC;
        `,
      },
      compare: {
        left: { lang: 'python', code: 'counts = {}\nfor p in products:\n    c = p["category"]\n    counts[c] = counts.get(c, 0) + 1' },
        right: { lang: 'sql', code: 'SELECT category, COUNT(*)\nFROM products\nGROUP BY category;' },
        same: ['Group items by a key and count/sum per group'],
        different: ['SQL does it declaratively in one statement', 'HAVING filters the groups afterwards'],
      },
    },
  ],
  practice: [
    {
      title: 'Customers per city',
      minutes: 2,
      prompt: 'For each `city`, select the city and the number of customers there, ordered by city.',
      starter: 'SELECT city FROM customers;\n',
      sqlSetup: DB,
      solution: 'SELECT city, COUNT(*) FROM customers GROUP BY city ORDER BY city;\n',
      solutionExplain: 'GROUP BY city makes one group per city; COUNT(*) counts rows in each.',
      hints: ['Use `COUNT(*)` with `GROUP BY city`.', '`SELECT city, COUNT(*) FROM customers GROUP BY city ORDER BY city;`'],
      tests: [rows('Counts per city', [['Boston', 1], ['Helsinki', 1], ['London', 2], ['New York', 1]], 'One row per city with its count.', true)],
    },
    {
      title: 'Total units ordered',
      minutes: 2,
      prompt: 'Select the total `quantity` across all orders as one number.',
      starter: 'SELECT quantity FROM orders;\n',
      sqlSetup: DB,
      solution: 'SELECT SUM(quantity) FROM orders;\n',
      solutionExplain: 'Without GROUP BY, an aggregate treats the whole table as one group.',
      hints: ['An aggregate function adds up a column.', '`SELECT SUM(quantity) FROM orders;`'],
      tests: [rows('Sum of quantities', [[16]], '1 + 3 + 2 + 1 + 1 + 2 + 1 + 5 = 16.')],
    },
  ],
  challenges: [
    {
      title: 'Busy months',
      minutes: 5,
      prompt: `Report units sold per month, but only **busy** months with **more than 4** units.

Dates look like \`2026-01-05\`. \`substr(order_date, 1, 7)\` takes the first 7 characters — \`2026-01\` — which is the month.

Return columns \`month\` and \`units\`, ordered by month.`,
      starter: 'SELECT order_date, quantity FROM orders;\n',
      sqlSetup: DB,
      solution: 'SELECT substr(order_date, 1, 7) AS month, SUM(quantity) AS units\nFROM orders\nGROUP BY month\nHAVING units > 4\nORDER BY month;\n',
      solutionExplain: 'Group by the computed month, sum the quantities per group, then HAVING drops groups with 4 or fewer units (February).',
      hints: ['Group by the month expression (give it an alias with AS), and SUM the quantity.', 'Filter groups with `HAVING units > 4` — WHERE can\'t see sums.'],
      tests: [rows('Busy months', [['2026-01', 6], ['2026-03', 6]], 'January (6) and March (6) have more than 4 units; February has exactly 4.', true)],
    },
    {
      title: 'Category scorecard',
      minutes: 4,
      prompt: 'For each product `category`: the category, the number of products, the cheapest price and the total stock. Only include categories whose total stock is **at least 50**. Order by category.',
      starter: 'SELECT category FROM products;\n',
      sqlSetup: DB,
      solution: 'SELECT category, COUNT(*), MIN(price), SUM(stock)\nFROM products\nGROUP BY category\nHAVING SUM(stock) >= 50\nORDER BY category;\n',
      solutionExplain: 'Several aggregates can run in the same GROUP BY. HAVING filters on an aggregate — Hardware (16 in stock) is dropped.',
      hints: ['Four columns: `category, COUNT(*), MIN(price), SUM(stock)` with `GROUP BY category`.', '`HAVING SUM(stock) >= 50 ORDER BY category`'],
      tests: [rows('Scorecard', [['Software', 2, 29.5, 200]], 'Accessories has only 47 in stock and Hardware 16, so only Software qualifies.', true)],
    },
  ],
  quiz: [
    {
      kind: 'bug',
      prompt: 'Why does this fail with "misuse of aggregate"?',
      code: 'SELECT category FROM products\nWHERE COUNT(*) > 2\nGROUP BY category;',
      codeLang: 'sql',
      options: ['COUNT needs a column name', 'Aggregates can\'t go in WHERE — use HAVING after GROUP BY', 'GROUP BY must come first', 'category must be quoted'],
      answer: 1,
      explain: 'WHERE runs before grouping, so counts don\'t exist yet. Use `HAVING COUNT(*) > 2`.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'Table `s(team, pts)` has rows (A,3), (B,5), (A,4). What does this return? (Format: team pts, one per line.)',
      code: 'SELECT team, SUM(pts) FROM s GROUP BY team ORDER BY team;',
      codeLang: 'sql',
      answers: ['A 7\nB 5', 'A 7\nb 5'],
      explain: 'A: 3 + 4 = 7. B: 5.',
    },
    {
      kind: 'concept',
      prompt: 'What does `AS` do in `SUM(quantity) AS units`?',
      options: ['Creates a new table', 'Names the result column', 'Converts the type', 'Filters rows'],
      answer: 1,
      explain: '`AS` sets an alias — the name of the result column.',
    },
  ],
});
