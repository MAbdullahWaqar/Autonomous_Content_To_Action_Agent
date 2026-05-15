// ============================================================
// Firestore Operations — Report CRUD
// ============================================================

import { getAdminDb } from './firebase-admin';
import type { ReportDocument, PipelineResult } from './agents/types';

const REPORTS_COLLECTION = 'reports';

// ── Save a pipeline result as a report ──────────────────────
export async function saveReport(
  userId: string,
  result: PipelineResult
): Promise<string> {
  const doc: ReportDocument = {
    id: result.id,
    userId,
    timestamp: result.timestamp,
    inputPreview: result.input.substring(0, 200),
    domain: result.content_understanding.domain,
    urgency: result.insight.urgency,
    severity: result.impact.severity,
    mainInsight: result.insight.main_insight,
    topAction: result.actions.top_action,
    result,
  };

  await getAdminDb()
    .collection(REPORTS_COLLECTION)
    .doc(result.id)
    .set(doc);

  return result.id;
}

// ── Get all reports for a user ──────────────────────────────
export async function getUserReports(
  userId: string,
  limit = 20
): Promise<ReportDocument[]> {
  const snapshot = await getAdminDb()
    .collection(REPORTS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as ReportDocument);
}

// ── Get a single report by ID ───────────────────────────────
export async function getReport(
  reportId: string,
  userId: string
): Promise<ReportDocument | null> {
  const doc = await getAdminDb()
    .collection(REPORTS_COLLECTION)
    .doc(reportId)
    .get();

  if (!doc.exists) return null;

  const data = doc.data() as ReportDocument;
  if (data.userId !== userId) return null;

  return data;
}

// ── Delete a report ─────────────────────────────────────────
export async function deleteReport(
  reportId: string,
  userId: string
): Promise<boolean> {
  const doc = await getAdminDb()
    .collection(REPORTS_COLLECTION)
    .doc(reportId)
    .get();

  if (!doc.exists) return false;

  const data = doc.data() as ReportDocument;
  if (data.userId !== userId) return false;

  await getAdminDb().collection(REPORTS_COLLECTION).doc(reportId).delete();
  return true;
}
