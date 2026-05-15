// ============================================================
// Real outbound webhook — fires after simulation + evidence
// Set ACTION_WEBHOOK_URL (e.g. https://webhook.site/...) to enable
// ============================================================

import type { WebhookDispatchResult } from '../agents/types';

export async function dispatchActionWebhook(payload: unknown): Promise<WebhookDispatchResult> {
  const url = process.env.ACTION_WEBHOOK_URL?.trim();
  if (!url) {
    return { attempted: false, skipped_reason: 'ACTION_WEBHOOK_URL not set' };
  }

  let target_host: string | undefined;
  try {
    target_host = new URL(url).host;
  } catch {
    return {
      attempted: false,
      skipped_reason: 'ACTION_WEBHOOK_URL is not a valid URL',
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'CTA-Agent/1.0 (hackathon action webhook)',
  };
  const secret = process.env.ACTION_WEBHOOK_SECRET?.trim();
  if (secret) {
    headers['X-CTA-Webhook-Secret'] = secret;
  }

  const dispatched_at = new Date().toISOString();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12_000),
    });
    const ok = res.ok;
    return {
      attempted: true,
      ok,
      http_status: res.status,
      dispatched_at,
      target_host,
      error: ok ? undefined : await safeText(res),
    };
  } catch (e) {
    return {
      attempted: true,
      ok: false,
      dispatched_at,
      target_host,
      error: e instanceof Error ? e.message : 'Webhook request failed',
    };
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 500);
  } catch {
    return '(no body)';
  }
}
