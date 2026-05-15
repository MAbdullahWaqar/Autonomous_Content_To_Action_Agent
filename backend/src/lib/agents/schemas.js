"use strict";
// ============================================================
// Zod Validation Schemas for Agent Outputs
// Ensures type-safe structured output from the LLM
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomeReportSchema = exports.SimulationSchema = exports.ActionCriticSchema = exports.ActionSchema = exports.ImpactSchema = exports.InsightSchema = exports.ContentUnderstandingSchema = void 0;
const zod_1 = require("zod");
// ── Agent 1: Content Understanding ──────────────────────────
exports.ContentUnderstandingSchema = zod_1.z.object({
    domain: zod_1.z.string().describe('The primary domain of the content (e.g., logistics, finance, policy, supply chain, healthcare, urban systems, business operations)'),
    entities: zod_1.z.array(zod_1.z.string()).describe('Key entities mentioned: companies, regions, people, products, systems'),
    change_detected: zod_1.z.string().describe('What changed or is about to change, stated clearly and specifically'),
    time_sensitivity: zod_1.z.enum(['immediate', 'this_week', 'this_quarter', 'long_term']).describe('How urgently does this need attention?'),
    inferred_context: zod_1.z.string().describe('Context NOT explicitly stated in the content but important for understanding implications'),
});
// ── Agent 2: Insight Extractor ──────────────────────────────
exports.InsightSchema = zod_1.z.object({
    key_facts: zod_1.z.array(zod_1.z.string()).min(2).max(5).describe('Specific, quantified facts extracted from the content — include numbers, percentages, regions'),
    main_insight: zod_1.z.string().describe('The single most important non-obvious insight — must be specific, quantified, and actionable. Not a restatement of the input.'),
    signals: zod_1.z.array(zod_1.z.string()).min(1).max(4).describe('Leading indicators or signals that suggest what happens next'),
    urgency: zod_1.z.enum(['low', 'medium', 'high', 'critical']).describe('How urgently should someone act on this insight?'),
});
// ── Agent 3: Impact Analyzer ────────────────────────────────
exports.ImpactSchema = zod_1.z.object({
    implications: zod_1.z.array(zod_1.z.string()).min(3).max(5).describe('First, second, and third-order consequences — each from a different stakeholder perspective'),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).describe('Overall severity of impact'),
    affected_stakeholders: zod_1.z.array(zod_1.z.string()).min(2).max(5).describe('Specific stakeholder groups affected (e.g., "last-mile delivery companies in Punjab", not just "businesses")'),
    estimated_impact: zod_1.z.string().describe('Quantified impact estimate with stated assumptions (e.g., "Rs. 1.2M additional monthly cost per 50-truck fleet")'),
    consequence_if_ignored: zod_1.z.string().describe('What happens if no action is taken — be specific about competitive or operational consequences'),
});
// ── Agent 4: Action Generator ───────────────────────────────
exports.ActionSchema = zod_1.z.object({
    recommended_actions: zod_1.z.array(zod_1.z.object({
        rank: zod_1.z.number().min(1).max(3),
        action: zod_1.z.string().describe('Specific, executable action — not vague advice'),
        rationale: zod_1.z.string().describe('Why this action, tied directly to the insight'),
        owner: zod_1.z.string().describe('Who executes this (job title, e.g., "Head of Logistics Operations")'),
        expected_result: zod_1.z.string().describe('Measurable outcome of taking this action'),
        priority: zod_1.z.enum(['high', 'medium', 'low']),
    })).length(3),
    top_action: zod_1.z.string().describe('The most critical action (Rank 1) restated clearly — this is what gets simulated'),
});
// ── Action Quality Critic (between actions and simulation) ───
exports.ActionCriticSchema = zod_1.z.object({
    verdict: zod_1.z.enum(['approve', 'reject']).describe('approve if actions are specific, tied to insight, and executable; reject if generic or misaligned'),
    reasoning_chain: zod_1.z.array(zod_1.z.string()).min(2).max(6).describe('Short chain: what you checked and why'),
    problems: zod_1.z
        .array(zod_1.z.string())
        .max(5)
        .describe('Concrete defects (empty if approve) — e.g. "Rank 1 lacks owner", "no numbers"'),
    improvement_instructions: zod_1.z
        .string()
        .describe('If reject: precise instructions to regenerate. If approve: one-line affirmation.'),
});
// ── Agent 5: Execution Simulator ────────────────────────────
exports.SimulationSchema = zod_1.z.object({
    action_taken: zod_1.z.string().describe('The action being simulated'),
    before_state: zod_1.z.array(zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number()]))).describe('Table rows showing the system state BEFORE action — use realistic placeholder data matching the scenario'),
    after_state: zod_1.z.array(zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number()]))).describe('Table rows showing the system state AFTER action — changed values must be clearly different from before_state'),
    steps: zod_1.z.array(zod_1.z.object({
        step: zod_1.z.number(),
        description: zod_1.z.string(),
        tool_used: zod_1.z.string().describe('One of: google_sheets_tool, gmail_tool, google_drive_tool, web_search_tool, crm_tool, notification_service, database_tool, analytics_tool'),
        status: zod_1.z.string(),
        timestamp: zod_1.z.string(),
    })).min(5).max(8),
    notification_subject: zod_1.z.string().describe('Email/SMS subject line — professional and realistic'),
    notification_body: zod_1.z.string().describe('Full email/SMS body — professional, send-ready, includes specific details from the simulation'),
    projected_reach: zod_1.z.string().describe('Number of customers/users this action would reach'),
    projected_revenue_impact: zod_1.z.string().describe('Estimated financial impact (e.g., "Rs. 500K saved monthly")'),
    time_to_effect: zod_1.z.string().describe('How long before impact is visible (e.g., "24-48 hours")'),
    risk_if_not_executed: zod_1.z.string().describe('Quantified risk of inaction'),
});
// ── Agent 6: Outcome Reporter ───────────────────────────────
exports.OutcomeReportSchema = zod_1.z.object({
    input_summary: zod_1.z.string().describe('One-line restatement of the input content'),
    insight_summary: zod_1.z.string().describe('Main insight with magnitude and urgency in one paragraph'),
    impact_summary: zod_1.z.string().describe('Severity + quantified impact + consequence if ignored in one paragraph'),
    actions_summary: zod_1.z.string().describe('Brief summary of the 3 recommended actions'),
    simulation_summary: zod_1.z.string().describe('Summary of what was simulated and the projected outcome'),
});
