// ============================================================
// Pipeline API Route — POST /api/pipeline
// Streams agent progress via Server-Sent Events (SSE)
// ============================================================

import { NextRequest } from 'next/server';
import { runPipeline, formatSSE } from '@/lib/agents/pipeline';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { saveReport } from '@/lib/firestore';
import type { SSEEvent } from '@/lib/agents/types';

export const maxDuration = 120; // Allow up to 2 minutes for full pipeline

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  // ── Verify auth ─────────────────────────────────────────
  const user = await verifyAuth(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // ── Parse request ───────────────────────────────────────
  let content: string;
  try {
    const body = await request.json();
    content = body.content;
    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return Response.json(
        { error: 'Content must be a string with at least 10 characters' },
        { status: 400 }
      );
    }
  } catch {
    return Response.json(
      { error: 'Invalid JSON body — expected { "content": "..." }' },
      { status: 400 }
    );
  }

  // ── Create SSE stream ──────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        try {
          controller.enqueue(encoder.encode(formatSSE(event)));
        } catch {
          // Stream may have been closed by client
        }
      };

      try {
        const result = await runPipeline(content, emit);

        // Save to Firestore
        try {
          await saveReport(user.uid, result);
        } catch (saveError) {
          console.error('Failed to save report to Firestore:', saveError);
          // Don't fail the pipeline if save fails
        }

        controller.close();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Pipeline failed';
        const errorEvent: SSEEvent = {
          type: 'pipeline_error',
          error: errMsg,
          timestamp: new Date().toISOString(),
        };
        try {
          controller.enqueue(encoder.encode(formatSSE(errorEvent)));
        } catch {
          // Stream closed
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
