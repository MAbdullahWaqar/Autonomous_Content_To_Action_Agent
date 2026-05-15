// ============================================================
// Pipeline Screen — Real-time agent progress visualization
// Shows each agent's status as the pipeline runs
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { runPipeline, type SSEEvent, type PipelineResult, type AntigravityWorkPlanClient, type PipelineContentSource } from '@/lib/api';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, getUrgencyColor } from '@/lib/theme';

const PIPELINE_INPUT_KEY = '@cta/pipeline_input';

const AGENT_INFO = [
  { name: 'ContentUnderstandingAgent', label: 'Content Understanding', icon: '🔍', desc: 'Analyzing domain, entities, changes' },
  { name: 'InsightExtractorAgent', label: 'Insight Extraction', icon: '💡', desc: 'Finding non-obvious patterns' },
  { name: 'ImpactAnalyzerAgent', label: 'Impact Analysis', icon: '⚠️', desc: 'Mapping consequences' },
  { name: 'ActionGeneratorAgent', label: 'Action Generation', icon: '🎯', desc: 'Creating executable actions' },
  { name: 'ExecutionSimulatorAgent', label: 'Execution Simulation', icon: '🚀', desc: 'Simulating top action' },
  { name: 'OutcomeReporter', label: 'Outcome Report', icon: '📊', desc: 'Generating final report' },
];

type AgentStatus = 'waiting' | 'running' | 'done' | 'error';

interface AgentState {
  status: AgentStatus;
  data?: any;
  error?: string;
  duration?: number;
}

export default function PipelineScreen() {
  const params = useLocalSearchParams<{ content?: string; source?: string }>();
  const [init, setInit] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [payload, setPayload] = useState<{ content: string; source: PipelineContentSource } | null>(null);

  const [workPlan, setWorkPlan] = useState<AntigravityWorkPlanClient | null>(null);
  const [workPlanBusy, setWorkPlanBusy] = useState(false);
  const [toolAuditLines, setToolAuditLines] = useState<string[]>([]);

  const [agents, setAgents] = useState<AgentState[]>(
    AGENT_INFO.map(() => ({ status: 'waiting' }))
  );
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<'running' | 'complete' | 'error'>('running');
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Pulse animation for active agent
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer
  useEffect(() => {
    if (pipelineStatus === 'running') {
      const timer = setInterval(() => setElapsed(Date.now() - startTime), 100);
      return () => clearInterval(timer);
    }
  }, [pipelineStatus, startTime]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PIPELINE_INPUT_KEY);
        if (stored) {
          const p = JSON.parse(stored) as { content: string; source: PipelineContentSource };
          await AsyncStorage.removeItem(PIPELINE_INPUT_KEY);
          if (!cancelled && p?.content && p?.source) {
            setPayload({ content: p.content, source: p.source });
            setInit('ready');
            return;
          }
        }
        if (params.content) {
          if (!cancelled) {
            setPayload({
              content: params.content,
              source: (params.source as PipelineContentSource) || 'text',
            });
            setInit('ready');
          }
          return;
        }
        if (!cancelled) {
          setBootError('No input staged. Go back and start an analysis.');
          setInit('error');
        }
      } catch {
        if (!cancelled) {
          setBootError('Could not load pipeline input.');
          setInit('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.content, params.source]);

  // Run pipeline
  useEffect(() => {
    if (init !== 'ready' || !payload) return;

    setWorkPlanBusy(true);

    const handleEvent = (event: SSEEvent) => {
      if (event.type === 'workplan_start') {
        setWorkPlanBusy(true);
      }
      if (event.type === 'workplan_complete' && event.data) {
        setWorkPlan(event.data as AntigravityWorkPlanClient);
        setWorkPlanBusy(false);
      }
      if (event.type === 'tool_invocation' && event.data) {
        const row = event.data as { audit_line?: string };
        if (row.audit_line) {
          setToolAuditLines((prev) => [...prev, row.audit_line as string]);
        }
      }

      if (event.type === 'agent_start' && event.agentIndex !== undefined) {
        setAgents(prev => {
          const updated = [...prev];
          updated[event.agentIndex!] = { status: 'running' };
          return updated;
        });
      }

      if (event.type === 'agent_complete' && event.agentIndex !== undefined) {
        setAgents(prev => {
          const updated = [...prev];
          updated[event.agentIndex!] = {
            status: 'done',
            data: event.data,
          };
          return updated;
        });
      }

      if (event.type === 'agent_error' && event.agentIndex !== undefined) {
        setAgents(prev => {
          const updated = [...prev];
          updated[event.agentIndex!] = {
            status: 'error',
            error: event.error,
          };
          return updated;
        });
      }

      if (event.type === 'pipeline_complete') {
        setResult(event.data as PipelineResult);
        setPipelineStatus('complete');
      }

      if (event.type === 'pipeline_error') {
        setWorkPlanBusy(false);
        setError(event.error || 'Pipeline failed');
        setPipelineStatus('error');
      }
    };

    runPipeline(payload.content, payload.source, handleEvent).catch((err) => {
      setError(err.message);
      setPipelineStatus('error');
    });
  }, [init, payload]);

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'running': return '🔄';
      case 'done': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'waiting': return COLORS.textMuted;
      case 'running': return COLORS.accent;
      case 'done': return COLORS.success;
      case 'error': return COLORS.error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Antigravity Pipeline</Text>
          <Text style={styles.headerTimer}>
            {pipelineStatus === 'running' ? '⏱ ' : pipelineStatus === 'complete' ? '✅ ' : '❌ '}
            {formatTime(pipelineStatus === 'complete' && result ? result.total_duration_ms : elapsed)}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {init === 'loading' && (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Loading input…</Text>
          </View>
        )}

        {init === 'error' && (
          <View style={styles.centerBlock}>
            <Ionicons name="alert-circle" size={40} color={COLORS.error} />
            <Text style={styles.errorTitle}>Cannot start</Text>
            <Text style={styles.errorMessage}>{bootError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {init === 'ready' && (
        <>
        {(workPlanBusy || workPlan) && (
          <View style={[styles.agentCard, { marginBottom: SPACING.lg }]}>
            <Text style={styles.agLabel}>Google Antigravity — Manager</Text>
            {workPlanBusy && !workPlan && (
              <View style={styles.outputRow}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.outputValue}>Planning mission & tasks…</Text>
              </View>
            )}
            {workPlan && (
              <>
                <Text style={styles.missionText}>{workPlan.mission}</Text>
                <Text style={styles.subtle}>Reasoning chain</Text>
                {workPlan.reasoning_chain.slice(0, 5).map((r, i) => (
                  <Text key={i} style={styles.chainLine}>{i + 1}. {r}</Text>
                ))}
              </>
            )}
          </View>
        )}

        {toolAuditLines.length > 0 && (
          <View style={[styles.agentCard, { marginBottom: SPACING.lg }]}>
            <Text style={styles.agLabel}>Mock tool bridge (executed)</Text>
            {toolAuditLines.map((line, i) => (
              <Text key={i} style={styles.chainLine}>{line}</Text>
            ))}
          </View>
        )}

        {/* ── Pipeline Progress ──────────────────────────── */}
        <View style={styles.pipelineContainer}>
          {AGENT_INFO.map((agent, index) => {
            const state = agents[index];
            const isActive = state.status === 'running';
            const isDone = state.status === 'done';
            const isError = state.status === 'error';

            return (
              <View key={agent.name}>
                <Animated.View
                  style={[
                    styles.agentCard,
                    isActive && styles.agentCardActive,
                    isDone && styles.agentCardDone,
                    isError && styles.agentCardError,
                    isActive && { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <View style={styles.agentHeader}>
                    <Text style={styles.agentIcon}>{agent.icon}</Text>
                    <View style={styles.agentHeaderText}>
                      <Text style={[styles.agentLabel, isDone && styles.agentLabelDone]}>
                        {agent.label}
                      </Text>
                      <Text style={styles.agentDesc}>
                        {isActive ? 'Processing...' : agent.desc}
                      </Text>
                    </View>
                    <View style={styles.agentStatus}>
                      {isActive ? (
                        <ActivityIndicator size="small" color={COLORS.accent} />
                      ) : (
                        <Text style={styles.statusIcon}>{getStatusIcon(state.status)}</Text>
                      )}
                    </View>
                  </View>

                  {/* Show key output for completed agents */}
                  {isDone && state.data && (
                    <View style={styles.agentOutput}>
                      {index === 0 && state.data.domain && (
                        <View style={styles.outputRow}>
                          <Text style={styles.outputLabel}>Domain:</Text>
                          <Text style={styles.outputValue}>{state.data.domain}</Text>
                        </View>
                      )}
                      {index === 1 && state.data.urgency && (
                        <View style={styles.outputRow}>
                          <Text style={styles.outputLabel}>Urgency:</Text>
                          <Text style={[styles.outputBadge, { color: getUrgencyColor(state.data.urgency) }]}>
                            {state.data.urgency.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {index === 2 && state.data.severity && (
                        <View style={styles.outputRow}>
                          <Text style={styles.outputLabel}>Severity:</Text>
                          <Text style={[styles.outputBadge, { color: getUrgencyColor(state.data.severity) }]}>
                            {state.data.severity.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {index === 3 && state.data.top_action && (
                        <View style={styles.outputRow}>
                          <Text style={styles.outputLabel}>Top Action:</Text>
                          <Text style={styles.outputValue} numberOfLines={2}>
                            {state.data.top_action}
                          </Text>
                        </View>
                      )}
                      {index === 4 && state.data.steps && (
                        <View style={styles.outputRow}>
                          <Text style={styles.outputLabel}>Steps:</Text>
                          <Text style={styles.outputValue}>
                            {state.data.steps.length} executed successfully
                          </Text>
                        </View>
                      )}
                      {index === 5 && (
                        <View style={styles.outputRow}>
                          <Text style={styles.outputValue}>Report generated ✨</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {isError && state.error && (
                    <View style={styles.agentOutput}>
                      <Text style={styles.errorText}>{state.error}</Text>
                    </View>
                  )}
                </Animated.View>

                {/* Connection line between agents */}
                {index < AGENT_INFO.length - 1 && (
                  <View style={styles.connectionLine}>
                    <View style={[
                      styles.line,
                      isDone && styles.lineDone,
                    ]} />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Result Actions ─────────────────────────────── */}
        {pipelineStatus === 'complete' && result && (
          <View style={styles.resultActions}>
            <TouchableOpacity
              onPress={() => router.replace({ pathname: '/report/[id]', params: { id: result.id, data: JSON.stringify(result) } })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewReportButton}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.viewReportText}>View Full Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Error State ────────────────────────────────── */}
        {pipelineStatus === 'error' && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            <Text style={styles.errorTitle}>Pipeline Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
        </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerTimer: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  centerBlock: {
    alignItems: 'center',
    paddingVertical: SPACING.huge,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  agLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.accent,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  missionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.md,
    fontWeight: '600',
  },
  subtle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    fontWeight: '700',
  },
  chainLine: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  pipelineContainer: {
    gap: 0,
  },
  agentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  agentCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surfaceElevated,
    ...SHADOWS.glow,
  },
  agentCardDone: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  agentCardError: {
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  agentHeaderText: {
    flex: 1,
  },
  agentLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  agentLabelDone: {
    color: COLORS.success,
  },
  agentDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  agentStatus: {
    width: 30,
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 18,
  },
  agentOutput: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  outputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  outputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  outputValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    flex: 1,
  },
  outputBadge: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
  },
  connectionLine: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
  },
  line: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
  },
  lineDone: {
    backgroundColor: COLORS.success,
  },
  resultActions: {
    marginTop: SPACING.xxxl,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.glow,
  },
  viewReportText: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.huge,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.error,
    marginTop: SPACING.lg,
  },
  errorMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
  },
});
