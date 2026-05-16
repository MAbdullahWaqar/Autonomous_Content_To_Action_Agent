// ============================================================
// Auth Middleware — Firebase Token Verification
// ============================================================

import { getAdminAuth } from './firebase-admin';

export interface AuthUser {
  uid: string;
  email: string | undefined;
}

/**
 * Verify a Firebase ID token from the Authorization header.
 * Returns the decoded user or null if invalid.
 */
export async function verifyAuth(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch (err) {
    console.error('Firebase Auth Verification Error:', err);
    return null;
  }
}

/**
 * Helper to create a 401 response
 */
export function unauthorizedResponse(): Response {
  return Response.json(
    { error: 'Unauthorized — valid Firebase auth token required' },
    { status: 401 }
  );
}
