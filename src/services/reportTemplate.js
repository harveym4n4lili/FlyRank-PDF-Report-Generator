const money = (value) => `€${Number(value).toFixed(2)}`;

const escapeHtml = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;'); // Keep data from breaking the HTML

export function buildReportHtml(report, orders) {
  const today = new Date().toISOString().slice(0, 10);

  const topProductRows = report.topProducts
    .map((p, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(p.product)}</td><td>${p.orders}</td><td class="num">${money(p.revenue)}</td></tr>`)
    .join('');

  const perDayRows = report.ordersPerDay
    .map((d) => `<tr><td>${d.day}</td><td class="num">${d.orders}</td></tr>`)
    .join('');

  const orderRows = orders
    .map((o) => `<tr><td>${o.id}</td><td>${o.created_at.slice(0, 10)}</td><td>${escapeHtml(o.customer)}</td><td>${escapeHtml(o.product)}</td><td class="num">${money(o.amount)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; font-size: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; }
  .subtitle { color: #6b7280; margin: 0 0 16px; }
  .totals { display: flex; gap: 16px; }
  .card { flex: 1; border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; background: #f3f4f6; }
  .card .label { color: #6b7280; font-size: 11px; text-transform: uppercase; }
  .card .value { font-size: 22px; font-weight: bold; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: left; }
  th { background: #1f2937; color: #fff; }
  .num { text-align: right; }

  /* Print CSS: never slice a row across pages; thead repeats on every page */
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  h2 { break-after: avoid; }
</style>
</head>
<body>
  <h1>Sales Report</h1>
  <p class="subtitle">Generated ${today}</p>

  <div class="totals">
    <div class="card"><div class="label">Total orders</div><div class="value">${report.totalOrders}</div></div>
    <div class="card"><div class="label">Total revenue</div><div class="value">${money(report.totalRevenue)}</div></div>
  </div>

  <h2>Top 5 products by revenue</h2>
  <table>
    <thead><tr><th>#</th><th>Product</th><th>Orders</th><th class="num">Revenue</th></tr></thead>
    <tbody>${topProductRows}</tbody>
  </table>

  <h2>Orders per day (last 7 days)</h2>
  <table>
    <thead><tr><th>Day</th><th class="num">Orders</th></tr></thead>
    <tbody>${perDayRows}</tbody>
  </table>

  <h2>All orders</h2>
  <table>
    <thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Product</th><th class="num">Amount</th></tr></thead>
    <tbody>${orderRows}</tbody>
  </table>
</body>
</html>`;
} // Template string: report numbers in, HTML page out
