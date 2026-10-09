# How the PDF Report Generator works

## 1. What it does and how to run it

A small Express API for a pretend coffee shop. It turns 200 orders in a SQLite database into a sales report PDF (totals, top 5 products, orders per day, all orders), saves the PDF to disk and hands it out by link. It makes at most one report per day unless you force a new one.

**Run it:** `npm install` → `npx playwright install chromium` → `npm run seed` → `npm start` → open http://localhost:3000/docs (or `curl -X POST localhost:3000/reports`, then download `/reports/<id>/file`).

## 2. Package scripts

| Script | Flow |
|---|---|
| `npm run seed` | `seed.js` → open `report.db` → delete all orders → insert 200 random → print count |
| `npm run report:data` | `printReportData.js` → `getReportData()` (4 SQL queries) → print JSON |
| `npm run report:pdf` | `renderTestPdf.js` → query → `buildReportHtml()` → `renderPdf()` → `reports/test.pdf` |
| `npm start` | `index.js` → mounts `/health`, `/reports`, `/docs` → listens on :3000 |
| `npm run dev` | same as `start`, restarts on file save (nodemon) |

## 3. The API flow

- **`POST /reports`** → report exists today (and no `force`)? → **200** + existing link · being made right now? → wait → **200** + same link · else → insert row → query → HTML → PDF `reports/<id>.pdf` → save path → **201** + `{ id, file }`
- **`GET /reports/:id`** → row found? → **200** + `{ id, created_at, file, path }` · else **404**
- **`GET /reports/:id/file`** → row + file on disk? → send the PDF as a download · else **404**

**The one rule, store and link:** the PDF is saved once on disk. JSON only carries its link, and only `/file` sends the PDF.

## 4. Where things live

| File | Job |
|---|---|
| `index.js` | starts the server, mounts routes and Swagger |
| `src/db/connection.js` | opens `report.db`, creates `orders` + `reports` tables |
| `src/db/seed.js` | fills `orders` with random data |
| `src/services/reportData.js` | the SQL queries |
| `src/services/reportTemplate.js` | numbers → HTML page |
| `src/services/renderPdf.js` | HTML → PDF (Playwright) |
| `src/services/reports.js` | full pipeline + once-per-day check |
| `src/routes/reports.js` · `health.js` | the endpoints |
| `src/swagger.js` | Swagger setup for `/docs` |
