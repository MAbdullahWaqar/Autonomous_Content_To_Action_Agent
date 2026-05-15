// Report Detail Screen — Full pipeline report view
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, getUrgencyColor } from '@/lib/theme';
import type { PipelineResult } from '@/lib/api';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.badge, { borderColor: color }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function DataTable({ data, highlight }: { data: Record<string, any>[]; highlight?: boolean }) {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={s.table}>
        <View style={s.tableRow}>
          {keys.map(k => <Text key={k} style={s.tableHeader}>{k}</Text>)}
        </View>
        {data.map((row, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
            {keys.map(k => (
              <Text key={k} style={[s.tableCell, highlight && s.tableCellHighlight]}>
                {String(row[k])}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function ReportScreen() {
  const { data } = useLocalSearchParams<{ id: string; data: string }>();
  let result: PipelineResult | null = null;
  try { result = data ? JSON.parse(data) : null; } catch { result = null; }

  if (!result) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.errorText}>Report data not available</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.linkText}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      const json = JSON.stringify({
        antigravity: result!.antigravity,
        outcome_evidence: result!.outcome_evidence,
        insight: { domain: result!.content_understanding.domain, key_facts: result!.insight.key_facts, main_insight: result!.insight.main_insight, signals: result!.insight.signals, urgency: result!.insight.urgency },
        impact: { implications: result!.impact.implications, severity: result!.impact.severity, affected_stakeholders: result!.impact.affected_stakeholders, estimated_impact: result!.impact.estimated_impact, consequence_if_ignored: result!.impact.consequence_if_ignored },
        actions: result!.actions,
        simulation: result!.simulation,
        agent_trace: result!.agent_trace,
      }, null, 2);
      await Share.share({ message: json, title: 'CTA Agent Report' });
    } catch {}
  };

  const r = result;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pipeline Report</Text>
        <TouchableOpacity onPress={handleShare} style={s.backBtn}>
          <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Input */}
        <Section title="📥 INPUT RECEIVED">
          <Text style={s.bodyText}>{r.report.input_summary}</Text>
        </Section>

        {/* Antigravity envelope */}
        {r.antigravity && (
          <Section title="🛰️ GOOGLE ANTIGRAVITY (RUNTIME)">
            <Text style={s.bodyText}>
              {r.antigravity.platform}. Ingestion: {r.antigravity.ingestion.source_type}
              {r.antigravity.ingestion.source_uri ? ` — ${r.antigravity.ingestion.source_uri}` : ''}.
            </Text>
            <Text style={s.subheading}>Mission</Text>
            <Text style={s.insightText}>{r.antigravity.work_plan.mission}</Text>
            <Text style={s.subheading}>Reasoning chain (Manager)</Text>
            {r.antigravity.work_plan.reasoning_chain.map((line, i) => (
              <Text key={i} style={s.listItem}>{i + 1}. {line}</Text>
            ))}
            <Text style={s.subheading}>Planned tasks (Manager)</Text>
            {r.antigravity.work_plan.planned_tasks.map((t) => (
              <Text key={t.task_id} style={s.listItem}>
                • [{t.manager_surface}] {t.title}
              </Text>
            ))}
            <Text style={s.subheading}>Tool integration (plan)</Text>
            <Text style={s.bodyText}>{r.antigravity.work_plan.tool_integration_notes}</Text>
            <Text style={s.subheading}>Tool bridge (executed)</Text>
            {r.antigravity.tool_invocations.map((inv) => (
              <Text key={inv.step} style={s.listItem}>
                {inv.step}. {inv.audit_line} ({inv.latency_ms}ms)
              </Text>
            ))}
            <Text style={s.subheading}>Reference</Text>
            <Text style={s.bodyText}>{r.antigravity.reference_url}</Text>
          </Section>
        )}

        {/* Simulated ops dashboard — deterministic diff / KPI layer */}
        {r.outcome_evidence && (
          <Section title="📊 SIMULATED OPS DASHBOARD (SANDBOX)">
            <Text style={s.bodyText}>
              Deterministic comparison of before/after rows (not a live ERP). Green flags = automated quality checks passed.
            </Text>
            <View style={s.badgeRow}>
              <Badge label={r.outcome_evidence.simulation_validation.state_changed ? 'STATE CHANGED ✓' : 'STATE WEAK'} color={r.outcome_evidence.simulation_validation.state_changed ? COLORS.success : COLORS.warning} />
              <Badge label={r.outcome_evidence.simulation_validation.steps_count_ok ? 'STEPS OK ✓' : 'STEPS'} color={r.outcome_evidence.simulation_validation.steps_count_ok ? COLORS.success : COLORS.warning} />
              <Badge label={r.outcome_evidence.simulation_validation.tools_all_acknowledged ? 'TOOLS OK ✓' : 'TOOLS'} color={r.outcome_evidence.simulation_validation.tools_all_acknowledged ? COLORS.success : COLORS.warning} />
            </View>
            {r.outcome_evidence.simulation_validation.warnings.length > 0 && (
              <>
                <Text style={s.subheading}>Quality notes</Text>
                {r.outcome_evidence.simulation_validation.warnings.map((w, i) => (
                  <Text key={i} style={s.warningText}>• {w}</Text>
                ))}
              </>
            )}
            <Text style={s.subheading}>KPI snapshots</Text>
            {r.outcome_evidence.dashboard_kpis.map((k, i) => (
              <View key={i} style={s.kpiCard}>
                <Text style={s.kpiMetric}>{k.metric}</Text>
                <Text style={s.kpiRow}><Text style={s.kpiLab}>Before: </Text>{k.before_snapshot}</Text>
                <Text style={s.kpiRow}><Text style={s.kpiLab}>After: </Text>{k.after_snapshot}</Text>
              </View>
            ))}
            <Text style={s.subheading}>Field-level changes</Text>
            {r.outcome_evidence.diff_highlights.length === 0 ? (
              <Text style={s.bodyText}>No row diff detected (see simulation tables).</Text>
            ) : (
              r.outcome_evidence.diff_highlights.map((h, i) => <Text key={i} style={s.listItem}>→ {h}</Text>)
            )}
          </Section>
        )}

        {/* Insight */}
        <Section title="🔍 INSIGHT SUMMARY">
          <View style={s.badgeRow}>
            <Badge label={`URGENCY: ${r.insight.urgency.toUpperCase()}`} color={getUrgencyColor(r.insight.urgency)} />
            <Badge label={r.content_understanding.domain.toUpperCase()} color={COLORS.accent} />
          </View>
          <Text style={s.insightText}>{r.insight.main_insight}</Text>
          <Text style={s.subheading}>Key Facts</Text>
          {r.insight.key_facts.map((f, i) => <Text key={i} style={s.listItem}>• {f}</Text>)}
          <Text style={s.subheading}>Signals</Text>
          {r.insight.signals.map((sig, i) => <Text key={i} style={s.listItem}>📡 {sig}</Text>)}
        </Section>

        {/* Impact */}
        <Section title="⚠️ IMPACT ANALYSIS">
          <Badge label={`SEVERITY: ${r.impact.severity.toUpperCase()}`} color={getUrgencyColor(r.impact.severity)} />
          <Text style={[s.bodyText, { marginTop: SPACING.md }]}>{r.report.impact_summary}</Text>
          <Text style={s.subheading}>Estimated Impact</Text>
          <Text style={s.highlightText}>{r.impact.estimated_impact}</Text>
          <Text style={s.subheading}>Consequence If Ignored</Text>
          <Text style={s.warningText}>{r.impact.consequence_if_ignored}</Text>
          <Text style={s.subheading}>Affected Stakeholders</Text>
          {r.impact.affected_stakeholders.map((st, i) => <Text key={i} style={s.listItem}>👥 {st}</Text>)}
        </Section>

        {/* Actions */}
        <Section title="✅ RECOMMENDED ACTIONS">
          {r.actions.recommended_actions.map((a) => (
            <View key={a.rank} style={[s.actionCard, a.rank === 1 && s.actionCardTop]}>
              <View style={s.actionHeader}>
                <Badge label={`RANK ${a.rank} — ${a.priority.toUpperCase()}`} color={a.rank === 1 ? COLORS.critical : a.rank === 2 ? COLORS.warning : COLORS.success} />
              </View>
              <Text style={s.actionTitle}>{a.action}</Text>
              <Text style={s.actionMeta}>👤 {a.owner}</Text>
              <Text style={s.actionMeta}>💡 {a.rationale}</Text>
              <Text style={s.actionMeta}>📈 {a.expected_result}</Text>
            </View>
          ))}
        </Section>

        {/* Simulation */}
        <Section title="🚀 EXECUTION SIMULATION">
          <Text style={s.simAction}>Simulating: {r.simulation.action_taken}</Text>

          <Text style={s.subheading}>Before State</Text>
          <DataTable data={r.simulation.before_state} />

          <Text style={s.subheading}>Execution Log</Text>
          {r.simulation.steps.map((step) => (
            <View key={step.step} style={s.stepRow}>
              <Text style={s.stepNum}>{step.step}</Text>
              <View style={s.stepContent}>
                <Text style={s.stepDesc}>{step.description}</Text>
                <Text style={s.stepTool}>{step.tool_used} • {step.timestamp}</Text>
              </View>
              <Text style={s.stepStatus}>✅</Text>
            </View>
          ))}

          <Text style={s.subheading}>After State</Text>
          <DataTable data={r.simulation.after_state} highlight />

          {/* Notification */}
          <Text style={s.subheading}>📧 Notification Drafted</Text>
          <View style={s.emailCard}>
            <Text style={s.emailSubject}>Subject: {r.simulation.notification_subject}</Text>
            <Text style={s.emailBody}>{r.simulation.notification_body}</Text>
          </View>

          {/* Projected Outcome */}
          <Text style={s.subheading}>Projected Outcome</Text>
          <View style={s.metricsRow}>
            <View style={s.metricCard}><Text style={s.metricValue}>{r.simulation.projected_reach}</Text><Text style={s.metricLabel}>Reach</Text></View>
            <View style={s.metricCard}><Text style={s.metricValue}>{r.simulation.projected_revenue_impact}</Text><Text style={s.metricLabel}>Revenue Impact</Text></View>
          </View>
          <View style={s.metricsRow}>
            <View style={s.metricCard}><Text style={s.metricValue}>{r.simulation.time_to_effect}</Text><Text style={s.metricLabel}>Time to Effect</Text></View>
            <View style={s.metricCard}><Text style={[s.metricValue, { color: COLORS.error }]}>{r.simulation.risk_if_not_executed}</Text><Text style={s.metricLabel}>Risk if Ignored</Text></View>
          </View>
        </Section>

        {/* Agent Trace */}
        <Section title="🤖 AGENT EXECUTION TRACE">
          {r.agent_trace.map((t, i) => (
            <View key={i} style={s.traceRow}>
              <Text style={s.traceAgent}>{t.agent}</Text>
              <Text style={s.traceDuration}>{(t.duration_ms / 1000).toFixed(1)}s</Text>
              <Text style={s.traceOutput}>{t.key_output}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Pipeline Duration</Text>
            <Text style={s.totalValue}>{(r.total_duration_ms / 1000).toFixed(1)}s</Text>
          </View>
        </Section>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl },
  section: { marginBottom: SPACING.xxxl, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  bodyText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  insightText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, lineHeight: 22, marginVertical: SPACING.md, fontWeight: '500' },
  subheading: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  listItem: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, lineHeight: 20, marginBottom: SPACING.xs },
  highlightText: { fontSize: FONT_SIZES.md, color: COLORS.accent, fontWeight: '700' },
  warningText: { fontSize: FONT_SIZES.sm, color: COLORS.warning, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.sm },
  badge: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  badgeText: { fontSize: FONT_SIZES.xs, fontWeight: '800' },
  actionCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  actionCardTop: { borderColor: COLORS.primary, ...SHADOWS.lg },
  actionHeader: { marginBottom: SPACING.sm },
  actionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  actionMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 18 },
  simAction: { fontSize: FONT_SIZES.sm, color: COLORS.accent, fontWeight: '600', marginBottom: SPACING.md },
  table: { minWidth: 300 },
  tableRow: { flexDirection: 'row' },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  tableHeader: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, padding: SPACING.sm, minWidth: 100, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableCell: { fontSize: FONT_SIZES.xs, color: COLORS.textPrimary, padding: SPACING.sm, minWidth: 100 },
  tableCellHighlight: { color: COLORS.success },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700', textAlign: 'center', lineHeight: 24, marginRight: SPACING.md, overflow: 'hidden' },
  stepContent: { flex: 1 },
  stepDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },
  stepTool: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  stepStatus: { fontSize: 14, marginLeft: SPACING.sm },
  emailCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  emailSubject: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emailBody: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  metricsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  metricCard: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  metricValue: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.accent, textAlign: 'center' },
  metricLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  traceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexWrap: 'wrap', gap: SPACING.sm },
  traceAgent: { fontSize: FONT_SIZES.xs, color: COLORS.textPrimary, fontWeight: '600', width: 120 },
  traceDuration: { fontSize: FONT_SIZES.xs, color: COLORS.accent, fontWeight: '700', width: 40 },
  traceOutput: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, flex: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACING.lg, marginTop: SPACING.md },
  totalLabel: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.success },
  errorText: { color: COLORS.error, fontSize: FONT_SIZES.lg, textAlign: 'center', marginTop: 100 },
  linkText: { color: COLORS.primary, fontSize: FONT_SIZES.md, textAlign: 'center', marginTop: SPACING.lg },
  kpiCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  kpiMetric: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  kpiRow: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 2 },
  kpiLab: { fontWeight: '700', color: COLORS.textMuted },
});
