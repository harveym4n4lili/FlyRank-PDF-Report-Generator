# Generating a PDF report: concepts to learn

The big idea: **you never draw a PDF.** You write an HTML page and ask a real browser to "print" it.

Each stage turns the previous stage's output into the next thing:

```
rows in a DB → report object → HTML string → PDF file on disk → API link → user downloads
   (Stage 1)      (Stage 2)       (Stage 3)       (Stage 3)       (Stage 4)    (Stage 4 + 5)
```

Keep that chain in mind. Every section below is one link in it.

---

## Stage 0: The tools

- **Headless browser:** a real Chrome with no window, controlled by code. It prints a PDF exactly like Chrome's own Print dialog would.
- **Playwright:** the library that drives that browser. `npm install playwright` gets the code; `npx playwright install chromium` downloads the browser itself. You need both.

## Stage 1: Data to report on

- **SQLite:** a full SQL database stored in one file (`report.db`). Node has it built in: `import { DatabaseSync } from 'node:sqlite'`.
- **The four calls:** `db.exec(sql)` runs SQL that returns no rows · `prepare(sql).run(...)` writes · `.get()` returns one row · `.all()` returns many rows.
- **`?` placeholders:** `prepare('INSERT ... VALUES (?, ?)').run(a, b)`. Never paste values straight into SQL.
- **Seed data:** fake rows for development. Delete first, then insert, so running the seed twice still gives one clean copy.

**Output:** 200 rows like `{ id, customer, product, amount, created_at }`.

---

## Stage 2: Rows → one report object

**Why:** nobody reads 200 rows. A report needs a few numbers, so SQL does the summing for you.

**Step 1, write one query per number you want to show:**

| Want | SQL | Returns |
|---|---|---|
| How many orders | `SELECT COUNT(*) AS total FROM orders` | one row → `.get()` |
| Total money | `SELECT SUM(amount) AS revenue FROM orders` | one row → `.get()` |
| Best 5 products | `SELECT product, SUM(amount) AS revenue FROM orders GROUP BY product ORDER BY revenue DESC LIMIT 5` | 5 rows → `.all()` |
| Orders per day | `SELECT date(created_at) AS day, COUNT(*) AS orders FROM orders GROUP BY day` | one row per day → `.all()` |

`GROUP BY` is the key idea: split rows into buckets (one per product, one per day), then `SUM`/`COUNT` inside each bucket.

**Step 2, collect them into one object with one function:**

```js
function getReportData() {
  return {
    totalOrders:  db.prepare(SQL.totalOrders).get().total,
    totalRevenue: db.prepare(SQL.totalRevenue).get().revenue,
    topProducts:  db.prepare(SQL.topProducts).all(),
    ordersPerDay: db.prepare(SQL.ordersPerDay).all(),
  };
}
```

**Step 3, print it as JSON and sanity-check it:** no single product can earn more than the total.

**Output, the report object:**
```js
{ totalOrders: 200, totalRevenue: 20187.08, topProducts: [{ product, revenue }, ...], ordersPerDay: [{ day, orders }, ...] }
```

---

## Stage 3: Report object → HTML string → PDF file

This is the core skill, in three steps.

**Step 1, turn the object into HTML with a template string.** A template string is HTML with `${...}` holes. For lists, turn each item into a `<tr>` and glue them together:

```js
function buildReportHtml(report) {
  const rows = report.topProducts
    .map(p => `<tr><td>${p.product}</td><td>${p.revenue}</td></tr>`)
    .join('');

  return `
    <style>
      tr { break-inside: avoid; }   /* explained in step 3 */
    </style>
    <h1>Sales Report</h1>
    <p>Total revenue: ${report.totalRevenue}</p>
    <table>
      <thead><tr><th>Product</th><th>Revenue</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
```
Escape text from the database (`<` → `&lt;` and so on), or a name containing `<b>` breaks the page.

**Step 2, hand the HTML to the browser and print it.** These five lines are the whole HTML-to-PDF part:

```js
const browser = await chromium.launch();                        // start headless Chrome
const page = await browser.newPage();                           // open a blank tab
await page.setContent(html);                                    // load your HTML string into the tab
await page.pdf({ path: 'reports/test.pdf', format: 'A4', printBackground: true }); // print to a file
await browser.close();                                          // always close (put it in finally)
```
`printBackground: true` keeps background colours. Without it, coloured table headers print as white.

**Step 3, fix page breaks.** A long table runs over several pages, and the browser may cut a row in half at the page edge. Two CSS fixes:
- `tr { break-inside: avoid; }` → never split a row; move it to the next page instead.
- Put the header row inside `<thead>` → the browser repeats it at the top of every page.

Open the PDF and check: at least 2 pages, no cut rows, and the header on every page.

**Output:** a real PDF file on disk.

---

## Stage 4: PDF file → API link

Now an API runs Stages 2–3 for the user and gives them a link to the file.

**Key idea, store and link:** the PDF is an **artifact** (a produced file). Save it once on disk and keep only its **path** in a `reports` table. JSON responses carry a link to the file, never the file itself.

**The pipeline function puts every stage together:**
```js
async function generateReport() {
  const id = insertRow();                            // 1. new row in reports → gives an id
  const path = `reports/${id}.pdf`;                  //    name the file after the id
  const html = buildReportHtml(getReportData());     // 2. query (Stage 2) → HTML (Stage 3)
  await renderPdf(html, path);                       // 3. HTML → PDF on disk (Stage 3)
  savePath(id, path);                                // 4. store the path on the row
  return { id, file: `/reports/${id}/file` };        // 5. hand back a link, not the file
}
```
If rendering fails, delete the row so it doesn't point at a missing file.

**Three endpoints:**

| Endpoint | Does | Returns |
|---|---|---|
| `POST /reports` | runs `generateReport()` | `201` + `{ id, file }` |
| `GET /reports/:id` | looks up the row | `200` + row, or `404` |
| `GET /reports/:id/file` | sends the PDF from disk | `res.sendFile(path)`, or `404` |

Add the header `Content-Disposition: attachment; filename="report-1.pdf"` to the file response so browsers download it.

**Notice the wait:** the POST takes a few seconds because a browser is rendering. That's fine for one user. For big reports or many users, move the work into a **background job** and return `202` straight away.

**Output:** the user calls `POST`, gets a link, and downloads the PDF from it.

---

## Stage 5: Same request twice → one PDF

**Problem:** users double-click. Two clicks shouldn't make two PDFs.

**Idempotency** means the same request twice has one effect. Add a check at the start of `POST /reports`:

```js
const existing = findTodaysReport();                // SELECT ... WHERE date(created_at) = date('now')
if (existing && !force) return res.status(200).json(existing);   // reuse it, no new file
// otherwise generateReport() → 201
```
`{ "force": true }` skips the check when you really want a fresh report.

**The double-click race:** the second click can arrive *while the first PDF is still rendering*, so today's row isn't finished yet and the check misses it. Fix: keep the in-progress generation (a promise) in a variable, and let the second request `await` it instead of starting another.

---

## The recipe for a future project

1. Get the data → one function that returns a **report object** (SQL aggregation).
2. Write a **template function**: object → HTML string, with print CSS (`break-inside: avoid`, `<thead>`).
3. **Playwright:** `setContent(html)` → `page.pdf({ path, format: 'A4', printBackground: true })`.
4. **Store** the file on disk and its path in the DB; **serve** it by link.
5. Add an **idempotency check** so repeat requests reuse the file.

HTML + CSS decide how the PDF looks. Playwright only presses "Print".
