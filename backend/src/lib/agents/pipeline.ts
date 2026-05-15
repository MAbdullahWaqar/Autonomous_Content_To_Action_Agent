// ============================================================
// Pipeline Orchestrator
// Runs all 6 agents sequentially, passing context forward
// Supports SSE streaming of progress updates
// ============================================================

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { randomUUID } from 'crypto';

import {
  ContentUnderstandingSchema,
  InsightSchema,
  ImpactSchema,
  ActionSchema,
  SimulationSchema,
  OutcomeReportSchema,
} from './schemas';

import { AGENT_PROMPTS, SIMULATION_RETRY_SUFFIX } from './prompts';
import { AntigravityWorkPlanSchema } from '../antigravity/schemas';
import { ANTIGRAVITY_WORKPLAN_PROMPT } from '../antigravity/prompts';
import { executeAntigravityToolBridge } from '../antigravity/tool-bridge';
import { buildOutcomeEvidence, validateSimulation } from './outcome-evidence';

import type {
  PipelineResult,
  ContentUnderstandingOutput,
  InsightOutput,
  ImpactOutput,
  ActionOutput,
  SimulationOutput,
  OutcomeReport,
  AgentTraceEntry,
  SSEEvent,
  ContentIngestionMeta,
  AntigravityWorkPlan,
  AntigravityToolInvocation,
  OutcomeEvidence,
} from './types';

// ── Model Configuration ─────────────────────────────────────
const MODEL_ID = 'gemini-1.5-pro';

function getModel() {
  return google(MODEL_ID);
}

// ── Agent Names ─────────────────────────────────────────────
const AGENT_NAMES = [
  'ContentUnderstandingAgent',
  'InsightExtractorAgent',
  'ImpactAnalyzerAgent',
  'ActionGeneratorAgent',
  'ExecutionSimulatorAgent',
  'OutcomeReporter',
];

const ANTIGRAVITY_REFERENCE_URL =
  'https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/';

// ── Helper: Create SSE Event ────────────────────────────────
function createEvent(
  type: SSEEvent['type'],
  agentIndex?: number,
  data?: unknown,
  error?: string
): SSEEvent {
  return {
    type,
    agent: agentIndex !== undefined ? AGENT_NAMES[agentIndex] : undefined,
    agentIndex,
    data,
    error,
    timestamp: new Date().toISOString(),
  };
}

// ── Helper: Format SSE message ──────────────────────────────
function formatSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ── Main Pipeline Runner ────────────────────────────────────
export async function runPipeline(
  content: string,
  onEvent?: (event: SSEEvent) => void,
  ingestionMeta?: ContentIngestionMeta
): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const agentTrace: AgentTraceEntry[] = [];
  const emit = (event: SSEEvent) => onEvent?.(event);

  const ingestion: ContentIngestionMeta =
    ingestionMeta ?? { source_type: 'text', chars_resolved: content.length };

  emit(createEvent('ingestion_complete', undefined, ingestion));

  // ── Antigravity Manager: planning before specialist agents ─
  emit(createEvent('workplan_start'));
  let workPlan: AntigravityWorkPlan;
  try {
    const planningPayload = {
      ingestion,
      content_stats: { length: content.length },
      content_head: content.slice(0, 14_000),
      content_tail: content.length > 18_000 ? content.slice(-6_000) : undefined,
    };
    const wp = await generateObject({
      model: getModel(),
      schema: AntigravityWorkPlanSchema,
      prompt:
        ANTIGRAVITY_WORKPLAN_PROMPT +
        JSON.stringify(planningPayload, null, 2) +
        '\n\nFULL NORMALIZED TEXT:\n' +
        content.slice(0, 100_000),
    });
    workPlan = wp.object as AntigravityWorkPlan;
    emit(createEvent('workplan_complete', undefined, workPlan));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    emit(createEvent('pipeline_error', undefined, undefined, errMsg));
    throw new Error(`Antigravity Manager (work plan) failed: ${errMsg}`);
  }

  let toolInvocations: AntigravityToolInvocation[] = [];

  // ── Agent 1: Content Understanding ────────────────────────
  emit(createEvent('agent_start', 0));
  const agent1Start = Date.now();

  let contentUnderstanding: ContentUnderstandingOutput;
  try {
    const result = await generateObject({
      model: getModel(),
      schema: ContentUnderstandingSchema,
      prompt: AGENT_PROMPTS.contentUnderstanding + content,
    });
    contentUnderstanding = result.object;
    const duration = Date.now() - agent1Start;
    agentTrace.push({
      agent: AGENT_NAMES[0],
      status: 'done',
      duration_ms: duration,
      key_output: `Domain: ${contentUnderstanding.domain} | Sensitivity: ${contentUnderstanding.time_sensitivity}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_complete', 0, contentUnderstanding));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    agentTrace.push({
      agent: AGENT_NAMES[0],
      status: 'error',
      duration_ms: Date.now() - agent1Start,
      key_output: `Error: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_error', 0, undefined, errMsg));
    throw new Error(`Agent 1 (ContentUnderstanding) failed: ${errMsg}`);
  }

  // ── Agent 2: Insight Extractor ────────────────────────────
  emit(createEvent('agent_start', 1));
  const agent2Start = Date.now();

  let insight: InsightOutput;
  try {
    const context = JSON.stringify({
      original_content: content,
      content_understanding: contentUnderstanding,
    }, null, 2);

    const result = await generateObject({
      model: getModel(),
      schema: InsightSchema,
      prompt: AGENT_PROMPTS.insightExtractor + context,
    });
    insight = result.object;
    const duration = Date.now() - agent2Start;
    agentTrace.push({
      agent: AGENT_NAMES[1],
      status: 'done',
      duration_ms: duration,
      key_output: `Urgency: ${insight.urgency} | Facts: ${insight.key_facts.length}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_complete', 1, insight));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    agentTrace.push({
      agent: AGENT_NAMES[1],
      status: 'error',
      duration_ms: Date.now() - agent2Start,
      key_output: `Error: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_error', 1, undefined, errMsg));
    throw new Error(`Agent 2 (InsightExtractor) failed: ${errMsg}`);
  }

  // ── Agent 3: Impact Analyzer ──────────────────────────────
  emit(createEvent('agent_start', 2));
  const agent3Start = Date.now();

  let impact: ImpactOutput;
  try {
    const context = JSON.stringify({
      original_content: content,
      content_understanding: contentUnderstanding,
      insight,
    }, null, 2);

    const result = await generateObject({
      model: getModel(),
      schema: ImpactSchema,
      prompt: AGENT_PROMPTS.impactAnalyzer + context,
    });
    impact = result.object;
    const duration = Date.now() - agent3Start;
    agentTrace.push({
      agent: AGENT_NAMES[2],
      status: 'done',
      duration_ms: duration,
      key_output: `Severity: ${impact.severity} | Stakeholders: ${impact.affected_stakeholders.length}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_complete', 2, impact));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    agentTrace.push({
      agent: AGENT_NAMES[2],
      status: 'error',
      duration_ms: Date.now() - agent3Start,
      key_output: `Error: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_error', 2, undefined, errMsg));
    throw new Error(`Agent 3 (ImpactAnalyzer) failed: ${errMsg}`);
  }

  // ── Agent 4: Action Generator ─────────────────────────────
  emit(createEvent('agent_start', 3));
  const agent4Start = Date.now();

  let actions: ActionOutput;
  try {
    const context = JSON.stringify({
      original_content: content,
      content_understanding: contentUnderstanding,
      insight,
      impact,
    }, null, 2);

    const result = await generateObject({
      model: getModel(),
      schema: ActionSchema,
      prompt: AGENT_PROMPTS.actionGenerator + context,
    });
    actions = result.object;
    const duration = Date.now() - agent4Start;
    agentTrace.push({
      agent: AGENT_NAMES[3],
      status: 'done',
      duration_ms: duration,
      key_output: `TOP_ACTION: ${actions.top_action.substring(0, 60)}...`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_complete', 3, actions));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    agentTrace.push({
      agent: AGENT_NAMES[3],
      status: 'error',
      duration_ms: Date.now() - agent4Start,
      key_output: `Error: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_error', 3, undefined, errMsg));
    throw new Error(`Agent 4 (ActionGenerator) failed: ${errMsg}`);
  }

  // ── Agent 5: Execution Simulator ──────────────────────────
  emit(createEvent('agent_start', 4));
  const agent5Start = Date.now();

  let simulation!: SimulationOutput;
  let outcome_evidence!: OutcomeEvidence;
  try {
    const baseContext = JSON.stringify(
      {
        original_content: content,
        content_understanding: contentUnderstanding,
        insight,
        impact,
        actions,
      },
      null,
      2
    );

    for (let attempt = 1; attempt <= 2; attempt++) {
      const promptSuffix = attempt > 1 ? SIMULATION_RETRY_SUFFIX : '';
      const result = await generateObject({
        model: getModel(),
        schema: SimulationSchema,
        prompt: AGENT_PROMPTS.executionSimulator + baseContext + promptSuffix,
      });
      simulation = result.object;
      const v = validateSimulation(simulation);
      if (v.before_after_rows_ok && v.steps_count_ok && v.state_changed) {
        break;
      }
    }

    const postVal = validateSimulation(simulation);
    const duration = Date.now() - agent5Start;
    const qualityNote = postVal.warnings.length
      ? ` | QA: ${postVal.warnings.join('; ')}`
      : '';
    agentTrace.push({
      agent: AGENT_NAMES[4],
      status: 'done',
      duration_ms: duration,
      key_output: `${simulation.steps.length} steps | Reach: ${simulation.projected_reach}${qualityNote}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_complete', 4, simulation));

    toolInvocations = await executeAntigravityToolBridge(simulation);
    for (const inv of toolInvocations) {
      emit(createEvent('tool_invocation', undefined, inv));
    }

    outcome_evidence = buildOutcomeEvidence(simulation, toolInvocations);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    agentTrace.push({
      agent: AGENT_NAMES[4],
      status: 'error',
      duration_ms: Date.now() - agent5Start,
      key_output: `Error: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_error', 4, undefined, errMsg));
    throw new Error(`Agent 5 (ExecutionSimulator) failed: ${errMsg}`);
  }

  // ── Agent 6: Outcome Reporter ─────────────────────────────
  emit(createEvent('agent_start', 5));
  const agent6Start = Date.now();

  let report: OutcomeReport;
  try {
    const context = JSON.stringify({
      original_content: content,
      content_understanding: contentUnderstanding,
      insight,
      impact,
      actions,
      simulation,
      outcome_evidence,
      antigravity_work_plan: workPlan,
      antigravity_tool_executions: toolInvocations,
    }, null, 2);

    const result = await generateObject({
      model: getModel(),
      schema: OutcomeReportSchema,
      prompt: AGENT_PROMPTS.outcomeReporter + context,
    });
    report = result.object;
    const duration = Date.now() - agent6Start;
    agentTrace.push({
      agent: AGENT_NAMES[5],
      status: 'done',
      duration_ms: duration,
      key_output: 'Report generated',
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_complete', 5, report));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    agentTrace.push({
      agent: AGENT_NAMES[5],
      status: 'error',
      duration_ms: Date.now() - agent6Start,
      key_output: `Error: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_error', 5, undefined, errMsg));
    throw new Error(`Agent 6 (OutcomeReporter) failed: ${errMsg}`);
  }

  // ── Assemble Final Result ─────────────────────────────────
  const totalDuration = Date.now() - pipelineStart;

  const antigravity = {
    platform: 'Google Antigravity — Manager-orchestrated runtime' as const,
    reference_url: ANTIGRAVITY_REFERENCE_URL,
    work_plan: workPlan,
    tool_invocations: toolInvocations,
    ingestion,
  };

  const pipelineResult: PipelineResult = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    input: content,
    antigravity,
    content_understanding: contentUnderstanding,
    insight,
    impact,
    actions,
    simulation,
    outcome_evidence,
    report,
    agent_trace: agentTrace,
    total_duration_ms: totalDuration,
  };

  emit(createEvent('pipeline_complete', undefined, pipelineResult));

  return pipelineResult;
}

export { formatSSE, AGENT_NAMES };
