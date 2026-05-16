// ============================================================
// Pipeline API Route — POST /api/pipeline
// Streams agent progress via Server-Sent Events (SSE)
// ============================================================

import { NextRequest } from 'next/server';
import { runPipeline, formatSSE } from '@/lib/agents/pipeline';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { saveReport } from '@/lib/firestore';
import { resolvePipelineContent } from '@/lib/ingest/resolve-content';
import type { PipelineContentSource, SSEEvent, ContentIngestionMeta } from '@/lib/agents/types';

export const maxDuration = 300; // Allow up to 5 minutes for full pipeline

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

  // ── Parse request: text | URL | PDF (base64) ──────────────
  let resolvedText: string;
  let ingestionMeta: ContentIngestionMeta;
  let useStream = true;
  try {
    const body = await request.json();
    const raw = body.content;
    const source = (body.source ?? 'text') as PipelineContentSource;
    // Mobile clients use JSON mode — RN fetch cannot read SSE streams reliably.
    useStream = body.stream !== false;

    if (!raw || typeof raw !== 'string') {
      return Response.json(
        { error: 'Body must include string "content"' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (source === 'text' && raw.trim().length < 10) {
      return Response.json(
        { error: 'Text content must be at least 10 characters' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    if (source === 'url' && !/^https?:\/\//i.test(raw.trim())) {
      return Response.json(
        { error: 'URL source requires content to be an http(s) URL' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    if (source === 'pdf_base64' && raw.trim().length < 200) {
      return Response.json(
        { error: 'PDF source requires base64 content (too short)' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    if (source === 'image_base64' && raw.trim().length < 100) {
      return Response.json(
        { error: 'Image source requires base64 content (too short)' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const resolved = await resolvePipelineContent(raw.trim(), source);
    resolvedText = resolved.text;
    ingestionMeta = resolved.meta;

    if (resolvedText.length < 10) {
      return Response.json(
        { error: 'Resolved content too short after ingestion' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid request body';
    return Response.json(
      { error: msg },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

  // ── JSON mode (mobile / clients without streaming) ─────
  if (!useStream) {
    const events: SSEEvent[] = [];
    const emit = (event: SSEEvent) => {
      events.push(event);
    };

    try {
      const result = await runPipeline(resolvedText, emit, ingestionMeta);
      try {
        await saveReport(user.uid, result);
      } catch (saveError) {
        console.error('Failed to save report to Firestore:', saveError);
      }
      return Response.json({ result, events }, { headers: corsHeaders });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Pipeline failed';
      return Response.json({ error: errMsg }, { status: 500, headers: corsHeaders });
    }
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
        const result = await runPipeline(resolvedText, emit, ingestionMeta);

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
