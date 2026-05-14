// ============================================================
// Samples API Route — GET /api/samples
// Returns pre-loaded sample content for demo purposes
// ============================================================

import { SAMPLE_CONTENTS } from '@/lib/samples';

export async function GET() {
  return Response.json(SAMPLE_CONTENTS, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
