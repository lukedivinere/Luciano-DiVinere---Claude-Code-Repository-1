import { code, defineLevel, rows } from '../../dsl';
import { SANDBOX_DB as DB } from '../../sandboxDb';

export default defineLevel({
  id: 'w3.l13',
  title: 'SQL: JOIN',
  icon: '🔗',
  summary: 'Combine tables with keys: INNER and LEFT JOIN',
  lang: 'sql',
  teaches: ['sql-join'],
  requires: ['sql-select', 'sql-aggregate'],
  learn: [
    {
      title: 'Connecting tables',
      minutes: 3,
      analogy: 'A coat check: your ticket number connects **you** to **your coat** in another room. A **foreign key** is that ticket number, and JOIN walks across to fetch the matching row.',
      body: `Good databases avoid repeating data. Orders don't copy the customer's name — they store \`customer_id\`, pointing to a row in \`customers\`. A column that points to another table's primary key is a **foreign key**.

**JOIN** combines rows from two tables where the keys match:

\`\`\`sql
SELECT orders.id, customers.name
FROM orders
JOIN customers ON orders.customer_id = customers.id;
\`\`\`

Write \`table.column\` when both tables have a column with the same name (like \`id\`). Short **table aliases** help: \`FROM orders o JOIN customers c ON o.customer_id = c.id\`.

You can JOIN several tables in a row, and then GROUP BY as usual.`,
      example: {
        lang: 'sql',
        sqlSetup: DB,
        code: code`
          SELECT o.id, c.name, p.name AS product, o.quantity
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          JOIN products p ON o.product_id = p.id
          ORDER BY o.id;
        `,
      },
    },
    {
      title: 'LEFT JOIN: keep everyone',
      minutes: 2,
      analogy: 'Taking attendance: an INNER JOIN lists only students who handed in homework; a **LEFT JOIN** lists **every** student, with a blank next to those who didn\'t.',
      body: `A plain \`JOIN\` (an **INNER JOIN**) keeps only rows that match in **both** tables. A customer with no orders disappears.

\`LEFT JOIN\` keeps **every** row from the left (first) table. Where nothing matches, the right table's columns are \`NULL\` (SQL's "no value", like None):

\`\`\`sql
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
\`\`\`

To find rows with **no** match, test for NULL — with \`IS NULL\`, never \`= NULL\`:

\`\`\`sql
WHERE o.id IS NULL
\`\`\``,
      example: {
        lang: 'sql',
        sqlSetup: DB,
        code: code`
          SELECT c.name, COUNT(o.id) AS orders
          FROM customers c
          LEFT JOIN orders o ON o.customer_id = c.id
          GROUP BY c.name
          ORDER BY orders DESC;
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Who ordered?',
      minutes: 2,
      prompt: 'List each order\'s `id` and the **customer name**, ordered by order id.',
      starter: 'SELECT id, customer_id FROM orders;\n',
      sqlSetup: DB,
      solution: 'SELECT orders.id, customers.name\nFROM orders\nJOIN customers ON orders.customer_id = customers.id\nORDER BY orders.id;\n',
      solutionExplain: 'The JOIN matches each order\'s customer_id to a customer\'s id.',
      hints: ['`JOIN customers ON orders.customer_id = customers.id`', 'Select `orders.id, customers.name` — prefix columns with table names.'],
      tests: [rows('Orders with names', [[1, 'Ada'], [2, 'Ada'], [3, 'Grace'], [4, 'Linus'], [5, 'Grace'], [6, 'Margaret'], [7, 'Ada'], [8, 'Linus']], 'One row per order, with the customer\'s name.', true)],
    },

    {
      title: 'What did Linus buy?',
      minutes: 3,
      prompt: 'Select the **product names** ordered by the customer named `Linus`, alphabetically. You need to JOIN three tables.',
      starter: 'SELECT * FROM orders;\n',
      sqlSetup: DB,
      solution: "SELECT p.name\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN products p ON o.product_id = p.id\nWHERE c.name = 'Linus'\nORDER BY p.name;\n",
      solutionExplain: 'Orders connect customers to products: join both, then filter on the customer name.',
      hints: ['FROM orders, JOIN customers (for the name) and products (for the product name).', "`WHERE c.name = 'Linus' ORDER BY p.name`"],
      tests: [rows("Linus's products", [['Code Editor Pro'], ['USB Cable']], 'Linus ordered Code Editor Pro and USB Cable.', true)],
    },
  ],
  challenges: [
    {
      title: 'Customers with no orders',
      minutes: 4,
      prompt: 'Marketing wants to email customers who have **never ordered**. Select their `name` and `city`.',
      starter: 'SELECT name, city FROM customers;\n',
      sqlSetup: DB,
      solution: 'SELECT c.name, c.city\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;\n',
      solutionExplain: 'LEFT JOIN keeps every customer; those without orders get NULL order columns, which `IS NULL` picks out.',
      hints: ['An INNER JOIN would drop them. Use LEFT JOIN from customers to orders.', 'Then `WHERE o.id IS NULL`.'],
      tests: [rows('Never ordered', [['Alan', 'London']], 'Only Alan has no orders.')],
    },
    {
      title: 'Top spenders',
      minutes: 5,
      prompt: `Find the **top 3** customers by total spend. Spend per order is \`quantity × price\` (price lives in \`products\`).

Return \`name\` and \`spent\` (rounded to 2 decimals with \`ROUND(x, 2)\`), biggest first. You'll need **two** JOINs and a GROUP BY.`,
      starter: 'SELECT * FROM orders;\n',
      sqlSetup: DB,
      solution: 'SELECT c.name, ROUND(SUM(o.quantity * p.price), 2) AS spent\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN products p ON o.product_id = p.id\nGROUP BY c.name\nORDER BY spent DESC\nLIMIT 3;\n',
      solutionExplain: 'Join orders to both customers (for the name) and products (for the price), compute quantity × price per row, sum per customer, sort, and keep 3.',
      hints: ['FROM orders, JOIN customers ON customer_id, JOIN products ON product_id.', '`ROUND(SUM(o.quantity * p.price), 2) AS spent ... GROUP BY c.name ORDER BY spent DESC LIMIT 3`'],
      tests: [rows('Top 3', [['Grace', 407.5], ['Ada', 146.96], ['Linus', 108.95]], 'Grace: 2×189 + 29.50. Ada: 49.99 + 3×5.99 + 79. Linus: 79 + 5×5.99.', true)],
    },
  ],
  quiz: [
    {
      kind: 'predict',
      format: 'text',
      prompt: 'Table `a` has ids 1, 2, 3. Table `b` has a_id values 1, 1, 3. What number does this return?',
      code: 'SELECT COUNT(*) FROM a JOIN b ON b.a_id = a.id;',
      codeLang: 'sql',
      answers: ['3'],
      explain: 'Matches: a=1 twice, a=3 once → 3 rows. a=2 has no match and an inner join drops it.',
    },
    {
      kind: 'concept',
      prompt: 'A customer has no orders. Which JOIN still includes them?',
      options: ['INNER JOIN', 'LEFT JOIN (customers on the left)', 'Neither', 'Both'],
      answer: 1,
      explain: 'LEFT JOIN keeps every row of the left table.',
    },
    {
      kind: 'bug',
      prompt: 'This returns no rows even though some customers have no orders. Why?',
      code: 'SELECT c.name FROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id = NULL;',
      codeLang: 'sql',
      options: ['LEFT JOIN is wrong', 'Comparing with `= NULL` is never true; use `IS NULL`', 'Missing GROUP BY', 'c.name should be name'],
      answer: 1,
      explain: 'NULL means "unknown", so `= NULL` is unknown too. Use `IS NULL`.',
    },
    {
      kind: 'concept',
      prompt: 'What is `orders.customer_id`?',
      options: ['A primary key', 'A foreign key pointing to customers.id', 'An aggregate', 'An alias'],
      answer: 1,
      explain: 'It refers to another table\'s primary key — a foreign key.',
    },
  ],
});
