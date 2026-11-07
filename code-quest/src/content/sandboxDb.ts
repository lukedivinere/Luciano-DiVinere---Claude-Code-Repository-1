// Sample database for the SQL sandbox and some SQL lessons.
export const SANDBOX_DB = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, stock INTEGER);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, product_id INTEGER, quantity INTEGER, order_date TEXT);
INSERT INTO customers VALUES (1,'Ada','London'),(2,'Grace','New York'),(3,'Linus','Helsinki'),(4,'Margaret','Boston'),(5,'Alan','London');
INSERT INTO products VALUES (1,'Keyboard','Hardware',49.99,12),(2,'Mouse','Hardware',19.99,0),(3,'Monitor','Hardware',189.00,4),(4,'Code Editor Pro','Software',79.00,100),(5,'Antivirus','Software',29.50,100),(6,'USB Cable','Accessories',5.99,40),(7,'Laptop Stand','Accessories',34.00,7);
INSERT INTO orders VALUES (1,1,1,1,'2026-01-05'),(2,1,6,3,'2026-01-05'),(3,2,3,2,'2026-01-17'),(4,3,4,1,'2026-02-02'),(5,2,5,1,'2026-02-10'),(6,4,7,2,'2026-02-21'),(7,1,4,1,'2026-03-03'),(8,3,6,5,'2026-03-15');
`;
