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

import { AGENT_PROMPTS } from './prompts';

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
  onEvent?: (event: SSEEvent) => void
): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const agentTrace: AgentTraceEntry[] = [];
  const emit = (event: SSEEvent) => onEvent?.(event);

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

  let simulation: SimulationOutput;
  try {
    const context = JSON.stringify({
      original_content: content,
      content_understanding: contentUnderstanding,
      insight,
      impact,
      actions,
    }, null, 2);

    const result = await generateObject({
      model: getModel(),
      schema: SimulationSchema,
      prompt: AGENT_PROMPTS.executionSimulator + context,
    });
    simulation = result.object;
    const duration = Date.now() - agent5Start;
    agentTrace.push({
      agent: AGENT_NAMES[4],
      status: 'done',
      duration_ms: duration,
      key_output: `${simulation.steps.length} steps executed | Reach: ${simulation.projected_reach}`,
      timestamp: new Date().toISOString(),
    });
    emit(createEvent('agent_complete', 4, simulation));
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

  const pipelineResult: PipelineResult = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    input: content,
    content_understanding: contentUnderstanding,
    insight,
    impact,
    actions,
    simulation,
    report,
    agent_trace: agentTrace,
    total_duration_ms: totalDuration,
  };

  emit(createEvent('pipeline_complete', undefined, pipelineResult));

  return pipelineResult;
}

export { formatSSE, AGENT_NAMES };
