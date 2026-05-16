// ============================================================
// Image → text via Gemini vision (one call at ingestion)
// ============================================================

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const MODEL_ID = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

const VISION_PROMPT = `You are ingesting visual content for a business intelligence pipeline.
Describe this image exhaustively for downstream analysts:
- Content type (photo, screenshot, chart, document scan, social post, etc.)
- All visible text (OCR), numbers, labels, dates
- Charts/graphs: trends, axes, key figures
- Business context: entities, products, events, risks
- Urgency or tone if visually apparent
Output plain text only with clear sections. Be factual; do not invent data not visible in the image.`;

function isRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|quota|resource.?exhausted|too many requests/i.test(msg);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeImageToText(buffer: Buffer, mimeType: string): Promise<string> {
  const maxAttempts = 4;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await generateText({
        model: google(MODEL_ID),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_PROMPT },
              { type: 'image', image: buffer, mimeType },
            ],
          },
        ],
      });
      const text = result.text.trim();
      if (text.length < 10) {
        throw new Error('Vision model returned too little text from this image');
      }
      return text;
    } catch (error) {
      if (!isRateLimitError(error) || attempt === maxAttempts - 1) {
        throw error;
      }
      const waitMs = Math.min(60_000, 3_000 * 2 ** attempt);
      console.warn(`[Vision] Rate limited, retrying in ${waitMs / 1000}s…`);
      await sleep(waitMs);
    }
  }

  throw new Error('analyzeImageToText: unreachable');
}

export function parseImageBase64(raw: string): { buffer: Buffer; mimeType: string } {
  const trimmed = raw.trim();
  if (trimmed.startsWith('data:')) {
    const match = /^data:([^;]+);base64,([\s\S]+)$/i.exec(trimmed);
    if (!match) throw new Error('Invalid image data URL');
    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (!buffer.length) throw new Error('Empty image payload');
    return { mimeType: match[1], buffer };
  }

  const buffer = Buffer.from(trimmed.replace(/\s/g, ''), 'base64');
  if (!buffer.length) throw new Error('Invalid image payload (not valid base64)');

  return { buffer, mimeType: detectImageMime(buffer) };
}

function detectImageMime(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF') return 'image/webp';
  return 'image/jpeg';
}
