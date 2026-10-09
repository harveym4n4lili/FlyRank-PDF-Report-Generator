import { Router } from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateReport, getReport, getReportRow } from '../services/reports.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         created_at:
 *           type: string
 *           example: 2026-10-09T12:00:00.000Z
 *         file:
 *           type: string
 *           example: /reports/1/file
 *         path:
 *           type: string
 *           example: reports/1.pdf
 */

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Generate a PDF report (query, render, store) - takes a few seconds
 *     responses:
 *       201:
 *         description: Report generated, returns its id and download link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       500:
 *         description: Report generation failed
 */
router.post('/', async (req, res) => {
  try {
    const report = await generateReport();
    res.status(201).json({ id: report.id, file: report.file });
  } catch (error) {
    console.error('Report generation failed:', error);
    res.status(500).json({ error: 'Report generation failed' });
  }
}); // POST route that runs the whole pipeline inside the request

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Get a report record, including its file link
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The report record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Report not found
 */
router.get('/:id', (req, res) => {
  const report = getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
}); // GET route that returns a report record

/**
 * @swagger
 * /reports/{id}/file:
 *   get:
 *     summary: Download the report PDF
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Report or file not found
 */
router.get('/:id/file', (req, res) => {
  const row = getReportRow(req.params.id);
  if (!row || !existsSync(row.path)) {
    return res.status(404).json({ error: 'Report file not found' });
  }
  res.sendFile(resolve(row.path), {
    headers: { 'Content-Disposition': `attachment; filename="report-${row.id}.pdf"` },
  }); // The only endpoint that moves the PDF bytes; attachment makes browsers and Swagger offer a download
}); // GET route that serves the PDF from disk

export default router;
