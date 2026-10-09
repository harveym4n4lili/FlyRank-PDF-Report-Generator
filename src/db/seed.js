import db from './connection.js';

const ORDER_COUNT = 200;
const PRODUCTS = ['Coffee Beans', 'Ceramic Mug', 'French Press', 'Pour-Over Kit', 'Milk Frother', 'Tea Sampler'];
const CUSTOMERS = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ivan', 'Julia'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const randomAmount = () => Math.round((5 + Math.random() * 195) * 100) / 100; // 5.00 to 200.00

const randomDateInLast30Days = () => {
  const msAgo = Math.random() * 30 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - msAgo).toISOString();
}; // ISO timestamp somewhere in the last 30 days

db.exec('DELETE FROM orders'); // Start clean so running the seed twice leaves one copy

const insert = db.prepare('INSERT INTO orders (customer, product, amount, created_at) VALUES (?, ?, ?, ?)');

db.exec('BEGIN');
for (let i = 0; i < ORDER_COUNT; i++) {
  insert.run(pick(CUSTOMERS), pick(PRODUCTS), randomAmount(), randomDateInLast30Days());
}
db.exec('COMMIT'); // One transaction so all 200 inserts land together

const { count } = db.prepare('SELECT COUNT(*) AS count FROM orders').get();
console.log(`Seeded report.db: ${count} orders`);
