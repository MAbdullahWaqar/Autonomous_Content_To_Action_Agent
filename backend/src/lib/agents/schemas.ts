// ============================================================
// Zod Validation Schemas for Agent Outputs
// Ensures type-safe structured output from the LLM
// ============================================================

import { z } from 'zod';

// ── Agent 1: Content Understanding ──────────────────────────
export const ContentUnderstandingSchema = z.object({
  domain: z.string().describe('The primary domain of the content (e.g., logistics, finance, policy, supply chain, healthcare, urban systems, business operations)'),
  entities: z.array(z.string()).describe('Key entities mentioned: companies, regions, people, products, systems'),
  change_detected: z.string().describe('What changed or is about to change, stated clearly and specifically'),
  time_sensitivity: z.enum(['immediate', 'this_week', 'this_quarter', 'long_term']).describe('How urgently does this need attention?'),
  inferred_context: z.string().describe('Context NOT explicitly stated in the content but important for understanding implications'),
});

// ── Agent 2: Insight Extractor ──────────────────────────────
export const InsightSchema = z.object({
  key_facts: z.array(z.string()).min(2).max(5).describe('Specific, quantified facts extracted from the content — include numbers, percentages, regions'),
  main_insight: z.string().describe('The single most important non-obvious insight — must be specific, quantified, and actionable. Not a restatement of the input.'),
  signals: z.array(z.string()).min(1).max(4).describe('Leading indicators or signals that suggest what happens next'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).describe('How urgently should someone act on this insight?'),
});

// ── Agent 3: Impact Analyzer ────────────────────────────────
export const ImpactSchema = z.object({
  implications: z.array(z.string()).min(3).max(5).describe('First, second, and third-order consequences — each from a different stakeholder perspective'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Overall severity of impact'),
  affected_stakeholders: z.array(z.string()).min(2).max(5).describe('Specific stakeholder groups affected (e.g., "last-mile delivery companies in Punjab", not just "businesses")'),
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
    priority: z.enum(['high', 'medium', 'low']),
  })).length(3),
  top_action: z.string().describe('The most critical action (Rank 1) restated clearly — this is what gets simulated'),
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
  })).min(5).max(8),
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
