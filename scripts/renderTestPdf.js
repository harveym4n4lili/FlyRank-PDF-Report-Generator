import { getReportData, getAllOrders } from '../src/services/reportData.js';
import { buildReportHtml } from '../src/services/reportTemplate.js';
import { renderPdf } from '../src/services/renderPdf.js';

const path = 'reports/test.pdf';

const html = buildReportHtml(getReportData(), getAllOrders());
await renderPdf(html, path);

console.log(`PDF written to ${path}`);
