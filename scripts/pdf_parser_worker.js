#!/usr/bin/env node
/**
 * Dedicated PDF Parser Worker for Resume Architect Platform
 * Runs in pure Node.js process to avoid Webpack/Next.js fake worker bundle resolution issues.
 * Uses pdfjs-dist legacy with layout-aware Y-coordinate line grouping.
 */

// Silence canvas polyfill warnings
console.warn = () => {};

const fs = require('fs');
const path = require('path');

async function extractPDFLayoutText(buffer) {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
    __dirname,
    '..',
    'node_modules',
    'pdfjs-dist',
    'legacy',
    'build',
    'pdf.worker.js'
  );

  const uint8 = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdf = await loadingTask.promise;
  let fullDocText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let lastY = null;
    let pageText = '';

    for (const item of textContent.items) {
      if (!item.str) continue;
      const currentY = item.transform ? item.transform[5] : null;
      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
        pageText += '\n';
      } else if (lastY !== null && !pageText.endsWith(' ') && !pageText.endsWith('\n') && !item.str.startsWith(' ')) {
        pageText += ' ';
      }
      pageText += item.str;
      if (currentY !== null) {
        lastY = currentY;
      }
    }
    fullDocText += pageText + '\n\n';
  }

  return fullDocText;
}

// ─── Main: Read from stdin or file argument ───
async function main() {
  let buffer;
  if (process.argv[2]) {
    buffer = fs.readFileSync(process.argv[2]);
  } else {
    buffer = await new Promise((resolve) => {
      const chunks = [];
      process.stdin.on('data', (chunk) => chunks.push(chunk));
      process.stdin.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  const text = await extractPDFLayoutText(buffer);
  process.stdout.write(JSON.stringify({ success: true, text }));
}

main().catch((err) => {
  process.stderr.write(err.message || String(err));
  process.exit(1);
});
