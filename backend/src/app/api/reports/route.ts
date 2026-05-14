// ============================================================
// Reports API Route — GET/DELETE /api/reports
// CRUD for saved pipeline reports
// ============================================================

import { NextRequest } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getUserReports, getReport, deleteReport } from '@/lib/firestore';

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ── GET /api/reports?id=xxx ─────────────────────────────────
// Without id: returns all reports for the user
// With id: returns a specific report
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorizedResponse();

  const reportId = request.nextUrl.searchParams.get('id');

  try {
    if (reportId) {
      const report = await getReport(reportId, user.uid);
      if (!report) {
        return Response.json({ error: 'Report not found' }, { status: 404 });
      }
      return Response.json(report);
    } else {
      const reports = await getUserReports(user.uid);
      return Response.json(reports);
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    return Response.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// ── DELETE /api/reports?id=xxx ───────────────────────────────
export async function DELETE(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorizedResponse();

  const reportId = request.nextUrl.searchParams.get('id');
  if (!reportId) {
    return Response.json(
      { error: 'Report ID required — use ?id=xxx' },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteReport(reportId, user.uid);
    if (!deleted) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }
    return Response.json({ success: true, id: reportId });
  } catch (error) {
    console.error('Error deleting report:', error);
    return Response.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
