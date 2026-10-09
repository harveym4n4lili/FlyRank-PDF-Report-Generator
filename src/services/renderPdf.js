import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { chromium } from 'playwright';

export async function renderPdf(html, path) {
  await mkdir(dirname(path), { recursive: true }); // Make sure reports/ exists

  const browser = await chromium.launch(); // Headless Chromium by default
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({
      path,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
    });
  } finally {
    await browser.close(); // Always close, even if rendering fails
  }
} // Ask a real browser to "print" the HTML to a PDF file
