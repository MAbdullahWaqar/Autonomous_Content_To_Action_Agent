// ============================================================
// Antigravity Tool Bridge — real mock execution of tool names
// Produces auditable invocation records (not LLM-only fantasy)
// ============================================================

import type { SimulationOutput, SimulationStep } from '../agents/types';

export interface AntigravityToolInvocation {
  step: number;
  tool_used: string;
  status: 'ok' | 'skipped';
  latency_ms: number;
  request_digest: string;
  response_digest: string;
  audit_line: string;
}

function digest(s: string, max = 160): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/** Deterministic mock handlers keyed by simulation tool_used */
async function invokeMockTool(step: SimulationStep): Promise<AntigravityToolInvocation> {
  const start = Date.now();
  const tool = step.tool_used;
  const desc = step.description;

  // Simulate async I/O (scheduler tick)
  await new Promise((r) => setTimeout(r, 8 + (step.step % 5) * 3));

  const latency = Date.now() - start;
  const base = `[MOCK] ${tool}`;

  switch (tool) {
    case 'google_sheets_tool':
      return {
        step: step.step,
        tool_used: tool,
        status: 'ok',
        latency_ms: latency,
        request_digest: digest(`PATCH range pricing!A2:D50 — ${desc}`),
        response_digest: '200 OK — rows_committed: 12',
        audit_line: `${base}: committed tabular pricing update (sandbox)`,
      };
    case 'gmail_tool':
      return {
        step: step.step,
        tool_used: tool,
        status: 'ok',
        latency_ms: latency,
        request_digest: digest(`sendMessage draft — ${desc}`),
        response_digest: 'queued — message_id: mock-msg-' + step.step,
        audit_line: `${base}: draft queued in sandbox mailer`,
      };
    case 'google_drive_tool':
      return {
        step: step.step,
        tool_used: tool,
        status: 'ok',
        latency_ms: latency,
        request_digest: digest(`createFile policy_brief.pdf — ${desc}`),
        response_digest: 'fileId: mock-drive-' + step.step,
        audit_line: `${base}: artifact stored in mock Drive volume`,
      };
    case 'web_search_tool':
      return {
        step: step.step,
        tool_used: tool,
        status: 'ok',
        latency_ms: latency,
        request_digest: digest(`search — ${desc}`),
        response_digest: 'results_cached: 6 (mock)',
        audit_line: `${base}: retrieved corroborating snippets (mock cache)`,
      };
    case 'crm_tool':
      return {
        step: step.step,
        tool_used: tool,
        status: 'ok',
        latency_ms: latency,
        request_digest: digest(`updateDealStage bulk — ${desc}`),
        response_digest: 'records_updated: 248 (mock)',
        audit_line: `${base}: CRM state mutation applied in sandbox DB`,
      };
    case 'notification_service':
      return {
        step: step.step,
        tool_used: tool,
        status: 'ok',
        latency_ms: latency,
        request_digest: digest(`pushTopic logistics_ops — ${desc}`),
        response_digest: 'subscribers_notified: 5000 (mock)',
        audit_line: `${base}: push fan-out completed (sandbox counter)`,
      };
    case 'database_tool':
      return {
        step: step.step,
        tool_used: tool,
        status: 'ok',
        latency_ms: latency,
        request_digest: digest(`transaction BEGIN … UPDATE checkout_pricing … ${desc}`),
        response_digest: 'commit: ok — checkout_version++',
        audit_line: `${base}: transactional pricing revision committed (mock)`,
      };
    case 'analytics_tool':
      return {
        step: step.step,
        tool_used: tool,
        status: 'ok',
        latency_ms: latency,
        request_digest: digest(`recompute cohort KPI — ${desc}`),
        response_digest: 'job_finished — dashboard_tile_refreshed',
        audit_line: `${base}: analytics tile refresh enqueued (mock)`,
      };
    default:
      return {
        step: step.step,
        tool_used: tool,
        status: 'skipped',
        latency_ms: latency,
        request_digest: digest(desc),
        response_digest: 'unknown_tool — logged only',
        audit_line: `${base}: passthrough log (no sandbox handler)`,
      };
  }
}

export async function executeAntigravityToolBridge(
  simulation: SimulationOutput
): Promise<AntigravityToolInvocation[]> {
  const out: AntigravityToolInvocation[] = [];
  for (const st of simulation.steps) {
    out.push(await invokeMockTool(st));
  }
  return out;
}
