import db from '../db/connection.js';
import { getReportData, getAllOrders } from './reportData.js';
import { buildReportHtml } from './reportTemplate.js';
import { renderPdf } from './renderPdf.js';

const fileLink = (id) => `/reports/${id}/file`;

const toResponse = (row) => ({
  id: row.id,
  created_at: row.created_at,
  file: fileLink(row.id),
}); // Only the link goes out in JSON, never the PDF bytes

export async function generateReport() {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO reports (created_at) VALUES (?)')
    .run(new Date().toISOString()); // Insert first so the file can be named after the id
  const id = Number(lastInsertRowid);
  const path = `reports/${id}.pdf`;

  try {
    const html = buildReportHtml(getReportData(), getAllOrders()); // Query
    await renderPdf(html, path); // Render
  } catch (error) {
    db.prepare('DELETE FROM reports WHERE id = ?').run(id); // Don't leave a row pointing at no file
    throw error;
  }

  db.prepare('UPDATE reports SET path = ? WHERE id = ?').run(path, id); // Store
  return getReport(id);
} // The whole pipeline, run inside the request

export function getReportRow(id) {
  return db.prepare('SELECT * FROM reports WHERE id = ? AND path IS NOT NULL').get(id);
} // Raw row, including the on-disk path; undefined if unknown or not finished

export function getReport(id) {
  const row = getReportRow(id);
  return row ? { ...toResponse(row), path: row.path } : undefined;
} // The row as returned by GET /reports/:id
