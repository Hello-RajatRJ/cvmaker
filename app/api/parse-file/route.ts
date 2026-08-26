import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { CVSemanticParser, isReadableText, sanitizeLines } from '@/utils/cvSemanticParser';

export const dynamic = 'force-dynamic';

// ─── PDF Text Extraction (pdf-parse + pdfjs-dist + zlib fallback) ───

async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    const { spawn } = await import('child_process');
    const workerScript = path.join(process.cwd(), 'scripts', 'pdf_parser_worker.js');
    if (fs.existsSync(workerScript)) {
      const result = await new Promise<string>((resolve, reject) => {
        const proc = spawn('node', [workerScript], { stdio: ['pipe', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d: any) => (stdout += d.toString()));
        proc.stderr.on('data', (d: any) => (stderr += d.toString()));
        proc.on('error', reject);
        proc.on('close', (code: number) => {
          if (code === 0) {
            try {
              const jsonStart = stdout.indexOf('{');
              if (jsonStart !== -1) {
                const parsed = JSON.parse(stdout.slice(jsonStart));
                resolve(parsed.text || '');
              } else {
                resolve(stdout);
              }
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(stderr || `PDF worker exited with code ${code}`));
          }
        });
        proc.stdin.write(buffer);
        proc.stdin.end();
      });

      if (result && result.trim().length > 10) {
        return sanitizeLines(result).join('\n');
      }
    }
  } catch (err: any) {
    console.error('[PDF Parser] Worker extraction error:', err?.message || err);
  }

  return '';
}

// ─── DOCX Text Extraction (mammoth + adm-zip XML extractor) ───

async function extractDOCXText(buffer: Buffer): Promise<string> {
  // Method 1: mammoth library
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    if (result.value && isReadableText(result.value) && result.value.trim().length > 10) {
      return sanitizeLines(result.value).join('\n');
    }
  } catch (err) {
    console.warn('[DOCX Parser] mammoth extraction error:', err);
  }

  // Method 2: AdmZip unzipping word/document.xml
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(buffer);
    const docEntry = zip.getEntry('word/document.xml');
    if (docEntry) {
      const xml = zip.readAsText(docEntry);
      const wtMatches = xml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      if (wtMatches.length > 0) {
        const text = wtMatches
          .map((tag: string) => tag.replace(/<[^>]+>/g, '').trim())
          .filter((t: string) => t.length > 0 && isReadableText(t))
          .join('\n');
        if (text.length > 10) return text;
      }
    }
  } catch (err2) {
    console.warn('[DOCX Parser] AdmZip extraction error:', err2);
  }

  return '';
}

// ─── POST Handler ───

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'Send file as multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    if (fileName.endsWith('.pdf')) {
      extractedText = await extractPDFText(buffer);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      extractedText = await extractDOCXText(buffer);
    } else if (fileName.endsWith('.csv')) {
      // CSV worker
      extractedText = buffer.toString('utf-8');
      try {
        const { spawn } = await import('child_process');
        const workerScript = path.join(process.cwd(), 'scripts', 'csv_parser_worker.js');
        if (fs.existsSync(workerScript)) {
          const result = await new Promise<any>((resolve, reject) => {
            const proc = spawn('node', [workerScript], { stdio: ['pipe', 'pipe', 'pipe'] });
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (d: any) => (stdout += d.toString()));
            proc.stderr.on('data', (d: any) => (stderr += d.toString()));
            proc.on('error', reject);
            proc.on('close', (code: number) => {
              if (code === 0) {
                try {
                  resolve(JSON.parse(stdout));
                } catch (e) {
                  reject(e);
                }
              } else {
                reject(new Error(stderr || `Worker exited ${code}`));
              }
            });
            proc.stdin.write(extractedText);
            proc.stdin.end();
          });
          return NextResponse.json({
            success: true,
            data: result,
            engine: 'csv-worker',
            message: `Extracted ${fileName} via worker subprocess`,
          });
        }
      } catch (workerErr: any) {
        console.log('[parse-file] CSV worker failed, falling back to semantic parser:', workerErr?.message);
      }
    } else {
      // Plain text or markdown
      extractedText = sanitizeLines(buffer.toString('utf-8')).join('\n');
    }

    // Ensure extracted text is clean and readable
    const cleanLines = sanitizeLines(extractedText);
    const cleanText = cleanLines.join('\n');

    if (!cleanText || cleanText.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract readable text from this file. Please ensure it contains selectable text.',
        },
        { status: 422 }
      );
    }

    // Process through universal semantic parser
    const parsed = CVSemanticParser.parse(cleanText);

    return NextResponse.json(
      {
        success: true,
        data: parsed,
        engine: fileName.endsWith('.pdf') ? 'pdf-parse' : fileName.endsWith('.docx') ? 'docx-extractor' : 'semantic-parser',
        message: `Extracted ${file.name} successfully`,
        extractionReport: parsed.extractionReport,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (err: any) {
    console.error('[parse-file Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to parse file' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
