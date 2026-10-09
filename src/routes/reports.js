import { Router } from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getOrCreateTodaysReport, getReport, getReportRow } from '../services/reports.js';

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
 *     description: Returns today's existing report (200) instead of generating a new one, unless force is true.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: A report was already generated today, returns the existing id and link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
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
    const force = req.body?.force === true; // Body is optional, so guard against it being missing
    const { report, created } = await getOrCreateTodaysReport({ force });
    res.status(created ? 201 : 200).json({ id: report.id, file: report.file });
  } catch (error) {
    console.error('Report generation failed:', error);
    res.status(500).json({ error: 'Report generation failed' });
  }
}); // POST route that runs the pipeline inside the request, at most once per day unless forced

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
