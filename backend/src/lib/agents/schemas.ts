// ============================================================
// Zod Validation Schemas for Agent Outputs
// Ensures type-safe structured output from the LLM
// ============================================================

import { z } from 'zod';

/** Coerce LLM output that returns a single string instead of an array. */
function coerceStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof val === 'string' && val.trim()) {
    return [val.trim()];
  }
  return [];
}

function normalizeEnum<T extends string>(
  val: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof val !== 'string') return fallback;
  const normalized = val.toLowerCase().trim().replace(/[\s-]+/g, '_');
  const direct = allowed.find((a) => a === normalized);
  if (direct) return direct;

  const aliases: Record<string, T> = {
    urgent: 'high' as T,
    severe: 'critical' as T,
    asap: 'immediate' as T,
    soon: 'this_week' as T,
  };
  return aliases[normalized] ?? fallback;
}

const stringArray = (minItems = 1) =>
  z.preprocess(
    coerceStringArray,
    minItems > 0 ? z.array(z.string()).min(minItems) : z.array(z.string())
  );

const urgencyLevel = () =>
  z.preprocess(
    (val) => normalizeEnum(val, ['low', 'medium', 'high', 'critical'] as const, 'medium'),
    z.enum(['low', 'medium', 'high', 'critical'])
  );

const severityLevel = () =>
  z.preprocess(
    (val) => normalizeEnum(val, ['low', 'medium', 'high', 'critical'] as const, 'medium'),
    z.enum(['low', 'medium', 'high', 'critical'])
  );

const timeSensitivity = () =>
  z.preprocess(
    (val) =>
      normalizeEnum(
        val,
        ['immediate', 'this_week', 'this_quarter', 'long_term'] as const,
        'this_quarter'
      ),
    z.enum(['immediate', 'this_week', 'this_quarter', 'long_term'])
  );

const priorityLevel = () =>
  z.preprocess(
    (val) => normalizeEnum(val, ['high', 'medium', 'low'] as const, 'medium'),
    z.enum(['high', 'medium', 'low'])
  );

// ── Agent 1: Content Understanding ──────────────────────────
export const ContentUnderstandingSchema = z.object({
  domain: z.string().describe('The primary domain of the content (e.g., logistics, finance, policy, supply chain, healthcare, urban systems, business operations)'),
  entities: stringArray(0).describe('Key entities mentioned: companies, regions, people, products, systems'),
  change_detected: z.string().describe('What changed or is about to change, stated clearly and specifically'),
  time_sensitivity: timeSensitivity().describe('How urgently does this need attention?'),
  inferred_context: z.string().describe('Context NOT explicitly stated in the content but important for understanding implications'),
});

// ── Agent 2: Insight Extractor ──────────────────────────────
export const InsightSchema = z.object({
  key_facts: stringArray().describe('Specific, quantified facts extracted from the content — include numbers, percentages, regions'),
  main_insight: z.string().min(1).describe('The single most important non-obvious insight — must be specific, quantified, and actionable. Not a restatement of the input.'),
  signals: stringArray().describe('Leading indicators or signals that suggest what happens next'),
  urgency: urgencyLevel().describe('How urgently should someone act on this insight?'),
});

// ── Agent 3: Impact Analyzer ────────────────────────────────
export const ImpactSchema = z.object({
  implications: stringArray().describe('First, second, and third-order consequences — each from a different stakeholder perspective'),
  severity: severityLevel().describe('Overall severity of impact'),
  affected_stakeholders: stringArray().describe('Specific stakeholder groups affected (e.g., "last-mile delivery companies in Punjab", not just "businesses")'),
  estimated_impact: z.string().describe('Quantified impact estimate with stated assumptions (e.g., "Rs. 1.2M additional monthly cost per 50-truck fleet")'),
  consequence_if_ignored: z.string().describe('What happens if no action is taken — be specific about competitive or operational consequences'),
});

// ── Agent 4: Action Generator ───────────────────────────────
export const ActionSchema = z.object({
  recommended_actions: z.array(z.object({
    rank: z.number().min(1).max(3),
    action: z.string().describe('Specific, executable action — not vague advice'),
    rationale: z.string().describe('Why this action, tied directly to the insight'),
    owner: z.string().describe('Who executes this (job title, e.g., "Head of Logistics Operations")'),
    expected_result: z.string().describe('Measurable outcome of taking this action'),
    priority: priorityLevel(),
  })).describe('Exactly 3 ranked actions based on the insights and impact analysis'),
  top_action: z.string().describe('The most critical action (Rank 1) restated clearly — this is what gets simulated'),
});

// ── Action Quality Critic (between actions and simulation) ───
export const ActionCriticSchema = z.object({
  verdict: z.enum(['approve', 'reject']).describe('approve if actions are specific, tied to insight, and executable; reject if generic or misaligned'),
  reasoning_chain: z.array(z.string()).describe('Short chain: what you checked and why'),
  problems: z
    .array(z.string())
    .describe('Concrete defects (empty if approve) — e.g. "Rank 1 lacks owner", "no numbers"'),
  improvement_instructions: z
    .string()
    .describe('If reject: precise instructions to regenerate. If approve: one-line affirmation.'),
});

// ── Agent 5: Execution Simulator ────────────────────────────
export const SimulationSchema = z.object({
  action_taken: z.string().describe('The action being simulated'),
  before_state: z.array(z.record(z.union([z.string(), z.number()]))).describe('Table rows showing the system state BEFORE action — use realistic placeholder data matching the scenario'),
  after_state: z.array(z.record(z.union([z.string(), z.number()]))).describe('Table rows showing the system state AFTER action — changed values must be clearly different from before_state'),
  steps: z.array(z.object({
    step: z.number(),
    description: z.string(),
    tool_used: z.string().describe('One of: google_sheets_tool, gmail_tool, google_drive_tool, web_search_tool, crm_tool, notification_service, database_tool, analytics_tool'),
    status: z.string(),
    timestamp: z.string(),
  })),
  notification_subject: z.string().describe('Email/SMS subject line — professional and realistic'),
  notification_body: z.string().describe('Full email/SMS body — professional, send-ready, includes specific details from the simulation'),
  projected_reach: z.string().describe('Number of customers/users this action would reach'),
  projected_revenue_impact: z.string().describe('Estimated financial impact (e.g., "Rs. 500K saved monthly")'),
  time_to_effect: z.string().describe('How long before impact is visible (e.g., "24-48 hours")'),
  risk_if_not_executed: z.string().describe('Quantified risk of inaction'),
});

// ── Agent 6: Outcome Reporter ───────────────────────────────
export const OutcomeReportSchema = z.object({
  input_summary: z.string().describe('One-line restatement of the input content'),
  insight_summary: z.string().describe('Main insight with magnitude and urgency in one paragraph'),
  impact_summary: z.string().describe('Severity + quantified impact + consequence if ignored in one paragraph'),
  actions_summary: z.string().describe('Brief summary of the 3 recommended actions'),
  simulation_summary: z.string().describe('Summary of what was simulated and the projected outcome'),
});
