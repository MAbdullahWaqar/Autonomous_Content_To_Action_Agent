import { generateObject } from 'ai';
import type { z } from 'zod';

function isRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|quota|resource.?exhausted|too many requests/i.test(msg);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Calls Gemini with backoff when free-tier / quota limits are hit. */
export async function generateObjectWithRetry<T extends z.ZodType>(options: {
  model: ReturnType<typeof import('@ai-sdk/google').google>;
  schema: T;
  prompt: string;
}): Promise<Awaited<ReturnType<typeof generateObject<T>>>> {
  const maxAttempts = 4;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await generateObject(options);
    } catch (error) {
      if (!isRateLimitError(error) || attempt === maxAttempts - 1) {
        throw error;
      }
      const waitMs = Math.min(60_000, 3_000 * 2 ** attempt);
      console.warn(
        `[Gemini] Rate limited (attempt ${attempt + 1}/${maxAttempts}), retrying in ${waitMs / 1000}s…`
      );
      await sleep(waitMs);
    }
  }

  throw new Error('generateObjectWithRetry: unreachable');
}
