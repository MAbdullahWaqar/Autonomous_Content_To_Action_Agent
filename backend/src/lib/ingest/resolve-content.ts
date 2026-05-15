// ============================================================
// Content ingestion — URL fetch + HTML→text, PDF text extract
// Invoked before Antigravity planning (real tool integration)
// ============================================================

import * as cheerio from 'cheerio';

import type { ContentIngestionMeta, PipelineContentSource } from '../agents/types';

const MAX_TEXT_CHARS = 120_000;
const MAX_PDF_BYTES = 5 * 1024 * 1024;

function stripHtmlToText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe').remove();
  const text = $('body').text() || $.root().text();
  return text.replace(/\s+/g, ' ').trim();
}

function isProbablyUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

export async function resolvePipelineContent(
  raw: string,
  source: PipelineContentSource
): Promise<{ text: string; meta: ContentIngestionMeta }> {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('Empty content');
  }

  if (source === 'text') {
    const text = trimmed.slice(0, MAX_TEXT_CHARS);
    return {
      text,
      meta: {
        source_type: 'text',
        chars_resolved: text.length,
        notes: isProbablyUrl(trimmed)
          ? 'Received as text; if this is a URL, choose URL mode for richer extraction.'
          : undefined,
      },
    };
  }

  if (source === 'url') {
    const url = trimmed;
    if (!isProbablyUrl(url)) {
      throw new Error('URL source requires a valid http(s) URL');
    }
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CTA-Agent/1.0 (+https://github.com) research/hackathon',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      throw new Error(`URL fetch failed: HTTP ${res.status}`);
    }
    const html = await res.text();
    const plain = stripHtmlToText(html).slice(0, MAX_TEXT_CHARS);
    if (plain.length < 10) {
      throw new Error('Could not extract readable text from this URL (empty or non-HTML)');
    }
    return {
      text: plain,
      meta: {
        source_type: 'url',
        source_uri: url,
        bytes_received: Buffer.byteLength(html, 'utf8'),
        chars_resolved: plain.length,
      },
    };
  }

  // pdf_base64
  const buf = Buffer.from(trimmed, 'base64');
  if (!buf.length) {
    throw new Error('Invalid PDF payload (not valid base64)');
  }
  if (buf.length > MAX_PDF_BYTES) {
    throw new Error(`PDF exceeds ${MAX_PDF_BYTES / (1024 * 1024)}MB limit`);
  }
  const pdfParse = (await import('pdf-parse')).default;
  const parsed = await pdfParse(buf);
  const text = (parsed.text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_CHARS);
  if (text.length < 10) {
    throw new Error('Could not extract enough text from PDF (try a text-based PDF)');
  }
  return {
    text,
    meta: {
      source_type: 'pdf_base64',
      bytes_received: buf.length,
      chars_resolved: text.length,
      notes: `Extracted ${parsed.numpages ?? '?'} page(s)`,
    },
  };
}
