// ============================================================
// Agent Pipeline Type Definitions
// Autonomous Content-To-Action Agent
// ============================================================

export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type TimeSensitivity = 'immediate' | 'this_week' | 'this_quarter' | 'long_term';
export type AgentStatus = 'waiting' | 'running' | 'done' | 'error';
export type Priority = 'high' | 'medium' | 'low';

export type PipelineContentSource = 'text' | 'url' | 'pdf_base64' | 'image_base64';

// ── Ingestion (URL / PDF / text) ────────────────────────────
export interface ContentIngestionMeta {
  source_type: PipelineContentSource;
  source_uri?: string;
  bytes_received?: number;
  chars_resolved: number;
  notes?: string;
  /** First ~400 chars of normalized text (for judges / webhooks) */
  text_preview?: string;
}

// ── Antigravity runtime envelope (Manager + tools + artifacts)
export interface AntigravityPlannedTask {
  task_id: string;
  title: string;
  manager_surface: 'planning' | 'analysis' | 'reasoning' | 'tools' | 'verification';
  depends_on: string[];
  expected_artifact: string;
}

export interface AntigravityWorkPlan {
  mission: string;
  reasoning_chain: string[];
  planned_tasks: AntigravityPlannedTask[];
  tool_integration_notes: string;
}

export interface AntigravityToolInvocation {
  step: number;
  tool_used: string;
  status: 'ok' | 'skipped';
  latency_ms: number;
  request_digest: string;
  response_digest: string;
  audit_line: string;
}

export interface AntigravityRuntime {
  platform: 'Google Antigravity — Manager-orchestrated runtime';
  reference_url: string;
  work_plan: AntigravityWorkPlan;
  tool_invocations: AntigravityToolInvocation[];
  ingestion: ContentIngestionMeta;
}

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

/** 7th reasoning step: critic after action generation */
export interface ActionCriticOutput {
  verdict: 'approve' | 'reject';
  reasoning_chain: string[];
  problems: string[];
  improvement_instructions: string;
}

export interface ActionQualitySummary {
  rounds_used: number;
  final_verdict: 'approve' | 'reject';
  last_critique: ActionCriticOutput;
}

export interface WebhookDispatchResult {
  attempted: boolean;
  skipped_reason?: string;
  ok?: boolean;
  http_status?: number;
  error?: string;
  dispatched_at?: string;
  target_host?: string;
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

/** Deterministic KPI / diff layer for judges (sandbox, not live ERP) */
export interface OutcomeDashboardKpi {
  metric: string;
  before_snapshot: string;
  after_snapshot: string;
}

export interface SimulationValidation {
  before_after_rows_ok: boolean;
  steps_count_ok: boolean;
  state_changed: boolean;
  tools_all_acknowledged: boolean;
  warnings: string[];
}

export interface OutcomeEvidence {
  diff_highlights: string[];
  dashboard_kpis: OutcomeDashboardKpi[];
  simulation_validation: SimulationValidation;
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
  antigravity: AntigravityRuntime;
  content_understanding: ContentUnderstandingOutput;
  insight: InsightOutput;
  impact: ImpactOutput;
  actions: ActionOutput;
  action_quality: ActionQualitySummary;
  simulation: SimulationOutput;
  outcome_evidence: OutcomeEvidence;
  webhook_dispatch: WebhookDispatchResult;
  report: OutcomeReport;
  agent_trace: AgentTraceEntry[];
  total_duration_ms: number;
}

// ── SSE Event Types ─────────────────────────────────────────
export type SSEEventType =
  | 'ingestion_start'
  | 'ingestion_complete'
  | 'workplan_start'
  | 'workplan_complete'
  | 'tool_invocation'
  | 'critic_start'
  | 'critic_complete'
  | 'action_regeneration_start'
  | 'webhook_dispatch'
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
