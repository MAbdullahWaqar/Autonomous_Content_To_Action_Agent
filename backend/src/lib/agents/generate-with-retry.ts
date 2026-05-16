import { generateObject, type GenerateObjectResult } from 'ai';
import type { z } from 'zod';

function isRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|quota|resource.?exhausted|too many requests/i.test(msg);
}

function isSchemaMismatchError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /did not match schema|No object generated|response did not match|Invalid JSON|ZodError|Type validation failed/i.test(
    msg
  );
}

const SCHEMA_RETRY_HINT =
  '\n\nSTRICT OUTPUT: Match the schema exactly. Use lowercase enum values only (e.g. urgency: low|medium|high|critical). key_facts and signals MUST be JSON arrays of strings, not a single string.';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Calls Gemini with backoff when free-tier / quota limits are hit. */
export async function generateObjectWithRetry<OBJECT>(options: {
  model: ReturnType<typeof import('@ai-sdk/google').google>;
  schema: z.Schema<OBJECT, z.ZodTypeDef, unknown>;
  prompt: string;
}): Promise<GenerateObjectResult<OBJECT>> {
  const maxAttempts = 4;

  let prompt = options.prompt;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await generateObject({ ...options, prompt });
    } catch (error) {
      const isLast = attempt === maxAttempts - 1;
      const rateLimited = isRateLimitError(error);
      const schemaMismatch = isSchemaMismatchError(error);

      if (isLast || (!rateLimited && !schemaMismatch)) {
        throw error;
      }

      if (schemaMismatch) {
        prompt = options.prompt + SCHEMA_RETRY_HINT;
        console.warn(
          `[Gemini] Schema mismatch (attempt ${attempt + 1}/${maxAttempts}), retrying with stricter prompt…`
        );
        continue;
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
