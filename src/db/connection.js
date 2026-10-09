import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('report.db'); // Single-file SQLite database in the project root

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL
  )
`); // Create the orders table on first use

export default db;
