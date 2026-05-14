// ============================================================
// Agent Pipeline Type Definitions
// Autonomous Content-To-Action Agent
// ============================================================

export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type TimeSensitivity = 'immediate' | 'this_week' | 'this_quarter' | 'long_term';
export type AgentStatus = 'waiting' | 'running' | 'done' | 'error';
export type Priority = 'high' | 'medium' | 'low';

// ── Agent 1: Content Understanding ──────────────────────────
export interface ContentUnderstandingOutput {
  domain: string;
  entities: string[];
  change_detected: string;
  time_sensitivity: TimeSensitivity;
  inferred_context: string;
}

// ── Agent 2: Insight Extractor ──────────────────────────────
export interface InsightOutput {
  key_facts: string[];
  main_insight: string;
  signals: string[];
  urgency: Urgency;
}

// ── Agent 3: Impact Analyzer ────────────────────────────────
export interface ImpactOutput {
  implications: string[];
  severity: Severity;
  affected_stakeholders: string[];
  estimated_impact: string;
  consequence_if_ignored: string;
}

// ── Agent 4: Action Generator ───────────────────────────────
export interface RecommendedAction {
  rank: number;
  action: string;
  rationale: string;
  owner: string;
  expected_result: string;
  priority: Priority;
}

export interface ActionOutput {
  recommended_actions: RecommendedAction[];
  top_action: string;
}

// ── Agent 5: Execution Simulator ────────────────────────────
export interface SimulationStep {
  step: number;
  description: string;
  tool_used: string;
  status: string;
  timestamp: string;
}

export interface SimulationOutput {
  action_taken: string;
  before_state: Record<string, string | number>[];
  after_state: Record<string, string | number>[];
  steps: SimulationStep[];
  notification_subject: string;
  notification_body: string;
  projected_reach: string;
  projected_revenue_impact: string;
  time_to_effect: string;
  risk_if_not_executed: string;
}

// ── Agent 6: Outcome Reporter ───────────────────────────────
export interface AgentTraceEntry {
  agent: string;
  status: string;
  duration_ms: number;
  key_output: string;
  timestamp: string;
}

export interface OutcomeReport {
  input_summary: string;
  insight_summary: string;
  impact_summary: string;
  actions_summary: string;
  simulation_summary: string;
}

// ── Full Pipeline Types ─────────────────────────────────────
export interface PipelineInput {
  content: string;
  userId?: string;
}

export interface PipelineResult {
  id: string;
  timestamp: string;
  input: string;
  content_understanding: ContentUnderstandingOutput;
  insight: InsightOutput;
  impact: ImpactOutput;
  actions: ActionOutput;
  simulation: SimulationOutput;
  report: OutcomeReport;
  agent_trace: AgentTraceEntry[];
  total_duration_ms: number;
}

// ── SSE Event Types ─────────────────────────────────────────
export type SSEEventType =
  | 'agent_start'
  | 'agent_complete'
  | 'agent_error'
  | 'pipeline_complete'
  | 'pipeline_error';

export interface SSEEvent {
  type: SSEEventType;
  agent?: string;
  agentIndex?: number;
  data?: unknown;
  error?: string;
  timestamp: string;
}

// ── Firestore Report Document ───────────────────────────────
export interface ReportDocument {
  id: string;
  userId: string;
  timestamp: string;
  inputPreview: string;
  domain: string;
  urgency: Urgency;
  severity: Severity;
  mainInsight: string;
  topAction: string;
  result: PipelineResult;
}
