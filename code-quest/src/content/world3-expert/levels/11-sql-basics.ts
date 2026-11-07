import { code, defineLevel, query, rows } from '../../dsl';
import { SANDBOX_DB as DB } from '../../sandboxDb';

export default defineLevel({
  id: 'w3.l11',
  title: 'SQL: SELECT & WHERE',
  icon: '🗄️',
  summary: 'Ask a database questions; add and change rows',
  lang: 'sql',
  teaches: ['sql-select', 'sql-write'],
  requires: ['nested-data', 'comparison', 'logic', 'sorting'],
  learn: [
    {
      title: 'Asking the librarian',
      minutes: 3,
      analogy: 'A database is a huge **library**, and SQL is how you **ask the librarian**: "bring me the titles and prices of every product under $50, cheapest first". You say *what* you want, not *how* to find it.',
      body: `A **database** stores data in **tables**: rows (records) and columns (fields) — like spreadsheets. **SQL** (Structured Query Language) is the language for asking questions, called **queries**:

\`\`\`sql
SELECT name, price          -- which columns
FROM products               -- which table
WHERE price < 50            -- which rows
ORDER BY price DESC         -- sort (DESC = biggest first)
LIMIT 3;                    -- at most 3 rows
\`\`\`

- \`SELECT *\` means all columns.
- Text values use **single quotes**: \`WHERE city = 'London'\`.
- Combine conditions with \`AND\`, \`OR\`, \`NOT\`.
- Comments start with \`--\`. Keywords are traditionally UPPERCASE (not required).

The tables for these exercises are shown in the 🗄️ panel.`,
      example: {
        lang: 'sql',
        sqlSetup: DB,
        code: code`
          SELECT name, price
          FROM products
          WHERE price < 50
          ORDER BY price DESC
          LIMIT 3;
        `,
      },
      compare: {
        left: { lang: 'python', code: 'cheap = [p for p in products if p["price"] < 50]\ncheap.sort(key=lambda p: -p["price"])\ncheap[:3]' },
        right: { lang: 'sql', code: 'SELECT name, price FROM products\nWHERE price < 50\nORDER BY price DESC\nLIMIT 3;' },
        same: ['Filter (if / WHERE), sort, take the first few', 'Comparisons `<`, `>=`, `=`… and/AND, or/OR'],
        different: ['SQL says WHAT you want; Python says HOW to loop', 'SQL uses `=` to compare (not `==`) and single quotes for text', 'The database does the work, even on millions of rows'],
      },
    },
    {
      title: 'Adding and changing rows',
      minutes: 3,
      analogy: 'Reading books is SELECT; **adding a new book**, **fixing a typo on a label** or **removing a book** are INSERT, UPDATE and DELETE.',
      body: `Create a table with \`CREATE TABLE\`, listing each column and its type (\`INTEGER\`, \`REAL\` for decimals, \`TEXT\`):

\`\`\`sql
CREATE TABLE pets (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);
INSERT INTO pets (name, age) VALUES ('Rex', 3), ('Tom', 5);
UPDATE pets SET age = 4 WHERE name = 'Rex';
DELETE FROM pets WHERE age > 4;
\`\`\`

A **primary key** uniquely identifies each row; \`INTEGER PRIMARY KEY\` numbers rows automatically.

⚠️ \`UPDATE\` or \`DELETE\` **without** \`WHERE\` changes **every** row. Always double-check your WHERE.

You can run several statements in one go; each ends with \`;\`.`,
      example: {
        lang: 'sql',
        code: code`
          CREATE TABLE pets (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);
          INSERT INTO pets (name, age) VALUES ('Rex', 3), ('Tom', 5), ('Kit', 1);
          UPDATE pets SET age = 4 WHERE name = 'Rex';
          DELETE FROM pets WHERE name = 'Kit';
          SELECT * FROM pets;
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Customers in London',
      minutes: 2,
      prompt: 'Select the `name` of every customer whose `city` is `London`, sorted by name.',
      starter: 'SELECT * FROM customers;\n',
      sqlSetup: DB,
      solution: "SELECT name FROM customers WHERE city = 'London' ORDER BY name;\n",
      solutionExplain: '`WHERE city = \'London\'` keeps the matching rows; only the `name` column is selected.',
      hints: ['Use `WHERE city = \'London\'` — text in single quotes.', "`SELECT name FROM customers WHERE city = 'London' ORDER BY name;`"],
      tests: [rows('London customers', [['Ada'], ['Alan']], 'Only the name column, for London customers, sorted.', true)],
    },
    {
      title: 'Most expensive first',
      minutes: 2,
      prompt: 'Select `name` and `price` of all **Hardware** products (category), most expensive first.',
      starter: 'SELECT name, price FROM products;\n',
      sqlSetup: DB,
      solution: "SELECT name, price FROM products WHERE category = 'Hardware' ORDER BY price DESC;\n",
      solutionExplain: 'Filter by category, then `ORDER BY price DESC` for biggest first.',
      hints: ['Add a WHERE on category, and ORDER BY price.', '`... WHERE category = \'Hardware\' ORDER BY price DESC;`'],
      tests: [rows('Hardware by price', [['Monitor', 189], ['Keyboard', 49.99], ['Mouse', 19.99]], 'Hardware only, highest price first.', true)],
    },
    {
      title: 'Add a customer',
      minutes: 2,
      prompt: "INSERT a new customer named `Katherine` from `Hampton` into `customers` (let the id be automatic), then SELECT the total number of customers with `SELECT COUNT(*) FROM customers;`.",
      starter: '-- INSERT, then count\n',
      sqlSetup: DB,
      solution: "INSERT INTO customers (name, city) VALUES ('Katherine', 'Hampton');\nSELECT COUNT(*) FROM customers;\n",
      solutionExplain: 'List the columns you\'re providing; the INTEGER PRIMARY KEY fills itself in. COUNT(*) counts rows.',
      hints: ["`INSERT INTO customers (name, city) VALUES ('Katherine', 'Hampton');`", 'Then `SELECT COUNT(*) FROM customers;`'],
      tests: [
        rows('Now 6 customers', [[6]], 'After inserting there should be 6 customers.'),
        query('Katherine was saved', "SELECT name, city FROM customers WHERE name = 'Katherine'", [['Katherine', 'Hampton']], 'The new row must have the right name and city.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Top 5 cheapest in stock',
      minutes: 4,
      prompt: 'The shop wants a "bargains" list: the `name` and `price` of the **5 cheapest** products that are **in stock** (`stock > 0`), cheapest first.',
      starter: 'SELECT name, price FROM products;\n',
      sqlSetup: DB,
      solution: 'SELECT name, price\nFROM products\nWHERE stock > 0\nORDER BY price\nLIMIT 5;\n',
      solutionExplain: 'WHERE removes out-of-stock items (the Mouse), ORDER BY sorts ascending by default, LIMIT keeps the first 5.',
      hints: ['You need WHERE, ORDER BY and LIMIT — in that order.', '`WHERE stock > 0 ORDER BY price LIMIT 5`'],
      tests: [
        rows('Five bargains', [['USB Cable', 5.99], ['Antivirus', 29.5], ['Laptop Stand', 34], ['Keyboard', 49.99], ['Code Editor Pro', 79]], 'Out-of-stock items are excluded (the Mouse has stock 0). Cheapest first, 5 rows.', true),
      ],
    },
    {
      title: 'Restock and report',
      minutes: 4,
      prompt: `Write **two** statements:

1. An \`UPDATE\` that adds 10 to the \`stock\` of every product with stock **under 5**.
2. A \`SELECT\` of \`name, stock\` for products with stock under 15, ordered by \`stock\` then \`name\`.`,
      starter: '-- 1. UPDATE\n\n-- 2. SELECT\n',
      sqlSetup: DB,
      solution: 'UPDATE products SET stock = stock + 10 WHERE stock < 5;\nSELECT name, stock FROM products WHERE stock < 15 ORDER BY stock, name;\n',
      solutionExplain: '`SET stock = stock + 10` uses each row\'s current value. Ordering by two columns sorts by stock, then by name for ties.',
      hints: ['`UPDATE products SET stock = stock + 10 WHERE stock < 5;`', 'Then `SELECT name, stock FROM products WHERE stock < 15 ORDER BY stock, name;`'],
      tests: [
        rows('Low-stock report', [['Laptop Stand', 7], ['Mouse', 10], ['Keyboard', 12], ['Monitor', 14]], 'Mouse (0→10) and Monitor (4→14) were restocked.', true),
        query('Only low items changed', 'SELECT SUM(stock) FROM products', [[283]], 'Exactly the two items under 5 get +10 each (total stock 263 → 283).'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'bug',
      prompt: 'This works in SQLite but fails in most other databases. What\'s the problem?',
      code: 'SELECT name FROM customers WHERE city = "London" ORDER BY name',
      codeLang: 'sql',
      options: ['ORDER BY must come before WHERE', 'Standard SQL text uses single quotes: \'London\' — double quotes mean a column name', 'name must be in quotes', 'Nothing is wrong'],
      answer: 1,
      explain: 'In standard SQL, double quotes name a column; text values need single quotes. SQLite forgives it, PostgreSQL and others don\'t.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'Table `t` has a column `n` with rows 5, 2, 9, 1. What does this return? (One value per line.)',
      code: 'SELECT n FROM t WHERE n > 1 ORDER BY n DESC LIMIT 2;',
      codeLang: 'sql',
      answers: ['9\n5'],
      explain: 'Keep 5, 2, 9 → sort descending 9, 5, 2 → first two.',
    },
    {
      kind: 'concept',
      prompt: 'What happens with `DELETE FROM orders;` (no WHERE)?',
      options: ['Error', 'Deletes the first row', 'Deletes EVERY row', 'Deletes the table definition'],
      answer: 2,
      explain: 'No WHERE means every row matches. Always check your WHERE clause!',
    },
  ],
});
