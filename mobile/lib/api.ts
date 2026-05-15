// ============================================================
// API Client — Communicates with the Next.js Backend
// Handles SSE streaming for pipeline updates
// ============================================================

import { auth } from './firebase';

// TODO: Update this to your deployed backend URL
// For local dev, use your machine's local network IP (not localhost)
// e.g., 'http://192.168.1.100:3000'
const API_BASE_URL = 'http://localhost:3000';

// ── Get auth token ──────────────────────────────────────────
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

// ── Generic fetch with auth ─────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ── Pipeline Types (mirrored from backend) ──────────────────
export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Priority = 'high' | 'medium' | 'low';

export type PipelineContentSource = 'text' | 'url' | 'pdf_base64';

export interface SSEEvent {
  type:
    | 'ingestion_complete'
    | 'workplan_start'
    | 'workplan_complete'
    | 'tool_invocation'
    | 'agent_start'
    | 'agent_complete'
    | 'agent_error'
    | 'pipeline_complete'
    | 'pipeline_error';
  agent?: string;
  agentIndex?: number;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface RecommendedAction {
  rank: number;
  action: string;
  rationale: string;
  owner: string;
  expected_result: string;
  priority: Priority;
}

export interface SimulationStep {
  step: number;
  description: string;
  tool_used: string;
  status: string;
  timestamp: string;
}

export interface AgentTraceEntry {
  agent: string;
  status: string;
  duration_ms: number;
  key_output: string;
  timestamp: string;
}

export interface AntigravityWorkPlanClient {
  mission: string;
  reasoning_chain: string[];
  planned_tasks: {
    task_id: string;
    title: string;
    manager_surface: string;
    depends_on: string[];
    expected_artifact: string;
  }[];
  tool_integration_notes: string;
}

export interface AntigravityToolInvocationClient {
  step: number;
  tool_used: string;
  status: string;
  latency_ms: number;
  request_digest: string;
  response_digest: string;
  audit_line: string;
}

export interface PipelineResult {
  id: string;
  timestamp: string;
  input: string;
  antigravity?: {
    platform: string;
    reference_url: string;
    work_plan: AntigravityWorkPlanClient;
    tool_invocations: AntigravityToolInvocationClient[];
    ingestion: {
      source_type: PipelineContentSource;
      source_uri?: string;
      bytes_received?: number;
      chars_resolved: number;
      notes?: string;
    };
  };
  content_understanding: {
    domain: string;
    entities: string[];
    change_detected: string;
    time_sensitivity: string;
    inferred_context: string;
  };
  insight: {
    key_facts: string[];
    main_insight: string;
    signals: string[];
    urgency: Urgency;
  };
  impact: {
    implications: string[];
    severity: Severity;
    affected_stakeholders: string[];
    estimated_impact: string;
    consequence_if_ignored: string;
  };
  actions: {
    recommended_actions: RecommendedAction[];
    top_action: string;
  };
  simulation: {
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
  };
  outcome_evidence?: {
    diff_highlights: string[];
    dashboard_kpis: {
      metric: string;
      before_snapshot: string;
      after_snapshot: string;
    }[];
    simulation_validation: {
      before_after_rows_ok: boolean;
      steps_count_ok: boolean;
      state_changed: boolean;
      tools_all_acknowledged: boolean;
      warnings: string[];
    };
  };
  report: {
    input_summary: string;
    insight_summary: string;
    impact_summary: string;
    actions_summary: string;
    simulation_summary: string;
  };
  agent_trace: AgentTraceEntry[];
  total_duration_ms: number;
}

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

export interface SampleContent {
  id: string;
  title: string;
  domain: string;
  icon: string;
  content: string;
}

// ── Run Pipeline (SSE Streaming) ────────────────────────────
export async function runPipeline(
  content: string,
  source: PipelineContentSource,
  onEvent: (event: SSEEvent) => void
): Promise<PipelineResult> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/pipeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content, source }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pipeline request failed: ${response.status} — ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: PipelineResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event: SSEEvent = JSON.parse(line.slice(6));
          onEvent(event);

          if (event.type === 'pipeline_complete' && event.data) {
            finalResult = event.data as PipelineResult;
          }

          if (event.type === 'pipeline_error') {
            throw new Error(event.error || 'Pipeline failed');
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes('Pipeline failed')) {
            throw parseError;
          }
          // Ignore JSON parse errors for incomplete data
        }
      }
    }
  }

  if (!finalResult) {
    throw new Error('Pipeline completed without a result');
  }

  return finalResult;
}

// ── Get User Reports ────────────────────────────────────────
export async function getReports(): Promise<ReportDocument[]> {
  const response = await apiFetch('/api/reports');
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
}

// ── Get Single Report ───────────────────────────────────────
export async function getReport(id: string): Promise<ReportDocument> {
  const response = await apiFetch(`/api/reports?id=${id}`);
  if (!response.ok) throw new Error('Report not found');
  return response.json();
}

// ── Delete Report ───────────────────────────────────────────
export async function deleteReportApi(id: string): Promise<void> {
  const response = await apiFetch(`/api/reports?id=${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete report');
}

// ── Get Sample Content ──────────────────────────────────────
export async function getSamples(): Promise<SampleContent[]> {
  const response = await fetch(`${API_BASE_URL}/api/samples`);
  if (!response.ok) throw new Error('Failed to fetch samples');
  return response.json();
}
