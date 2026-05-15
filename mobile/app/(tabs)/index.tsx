// ============================================================
// Home Screen — Content Input & Sample Selection
// The main entry point for running the agent pipeline
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '@/lib/theme';
import type { PipelineContentSource } from '@/lib/api';

const PIPELINE_INPUT_KEY = '@cta/pipeline_input';

type SourceMode = 'text' | 'url' | 'pdf';

// ── Inline sample data (no API call needed for samples) ─────
const SAMPLES = [
  {
    id: 'logistics-fuel',
    title: 'Fuel Price Hike',
    domain: 'Logistics',
    icon: '🚛',
    content: `BREAKING: Pakistan's petroleum division has announced a 15% increase in diesel prices effective immediately, raising the per-liter cost from Rs. 290 to Rs. 333.50. This marks the third consecutive monthly increase, bringing the cumulative rise to 28% over the past quarter.\n\nIndustry sources report that major logistics operators including TCS, Leopards Courier, and BlueEx are already seeing fuel costs consume 35-40% of their operational budgets, up from 28% six months ago. Last-mile delivery companies operating fleets of 50+ vehicles in Punjab and Sindh are particularly affected.\n\nThe All Pakistan Goods Transporters Association has threatened a nationwide strike if prices are not rolled back within 72 hours. Meanwhile, e-commerce platforms Daraz and Foodpanda have reported a 12% increase in delivery complaints related to delays attributed to route optimization changes by logistics partners.\n\nNo official government response has been issued regarding potential subsidies for the transport sector.`,
  },
  {
    id: 'finance-rates',
    title: 'Interest Rate Cut',
    domain: 'Finance',
    icon: '🏦',
    content: `The State Bank of Pakistan (SBP) has cut its benchmark interest rate by 200 basis points to 15%, signaling confidence in declining inflation which dropped to 11.8% in the latest reading. This is the fourth consecutive rate cut in 2024-25.\n\nBanking sector analysts at Topline Securities note that SME lending, which had contracted by 18% during the high-rate cycle, is expected to rebound. The Pakistan Microfinance Network reports that 2.3 million active borrowers — predominantly small retailers and agricultural producers in rural Sindh and Southern Punjab — stand to benefit from lower borrowing costs.\n\nHowever, bank deposit rates are also falling, with major banks offering 12-13% on savings accounts down from 18% six months ago. The Pakistan Stock Exchange KSE-100 index rallied 3.2% on the announcement, with banking stocks leading gains.\n\nReal estate developers in Lahore and Islamabad report a 20% surge in buyer inquiries following the announcement, suggesting capital may flow back into property markets.`,
  },
  {
    id: 'supply-chain',
    title: 'Port Congestion',
    domain: 'Supply Chain',
    icon: '🚢',
    content: `Karachi Port Trust (KPT) reports that container dwell time has increased to an average of 12 days, up from the normal 4-5 days, due to a combination of labor disputes and IT system failures. Approximately 8,500 containers are currently backlogged.\n\nThe Pakistan International Freight Forwarders Association estimates that importers are facing demurrage charges of Rs. 15,000-25,000 per container per day, with total industry losses approaching Rs. 2.8 billion over the past two weeks.\n\nTextile exporters, who account for 60% of Pakistan's exports, report that shipment delays are causing them to miss delivery windows with European buyers, risking contract penalties of 5-8% of order value.`,
  },
  {
    id: 'sales-decline',
    title: 'Sales Decline',
    domain: 'Business',
    icon: '📉',
    content: `Q3 regional sales report for FastMart (leading FMCG distributor):\n\nLahore Zone: Orders declined by 25% compared to Q2, dropping from Rs. 180M to Rs. 135M. The decline is concentrated in South Lahore territory where 3 of 5 major distributors have reported cashflow problems.\n\nKarachi Zone: Flat growth (+1.2%) but mix shifting toward lower-margin products. Premium SKU penetration fell from 34% to 22%.\n\nIslamabad Zone: Strong growth (+18%) driven by new modern trade partnerships.\n\nOverall: Company-wide gross margin compressed from 24% to 19.5%. Top competitor MegaMart reportedly offering 8% trade discounts to capture share.`,
  },
];

export default function HomeScreen() {
  const [sourceMode, setSourceMode] = useState<SourceMode>('text');
  const [bodyText, setBodyText] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);

  const canRun =
    sourceMode === 'text'
      ? bodyText.trim().length >= 10
      : sourceMode === 'url'
        ? /^https?:\/\//i.test(bodyText.trim())
        : !!pdfBase64;

  const handleAnalyze = async () => {
    if (!canRun) {
      if (sourceMode === 'text') {
        Alert.alert('Content Required', 'Please enter at least 10 characters.');
      } else if (sourceMode === 'url') {
        Alert.alert('URL Required', 'Enter a full URL starting with http:// or https://');
      } else {
        Alert.alert('PDF Required', 'Pick a PDF file first.');
      }
      return;
    }
    if (sourceMode === 'pdf' && pdfBase64 && pdfBase64.length > 7_000_000) {
      Alert.alert('PDF Too Large', 'Please use a PDF under ~5MB for reliable mobile upload.');
      return;
    }
    let content: string;
    let source: PipelineContentSource;
    if (sourceMode === 'text') {
      content = bodyText.trim();
      source = 'text';
    } else if (sourceMode === 'url') {
      content = bodyText.trim();
      source = 'url';
    } else {
      content = pdfBase64 as string;
      source = 'pdf_base64';
    }
    try {
      await AsyncStorage.setItem(PIPELINE_INPUT_KEY, JSON.stringify({ content, source }));
      router.push('/pipeline');
    } catch {
      Alert.alert('Storage Error', 'Could not stage input. Try a smaller PDF or shorter text.');
    }
  };

  const handleSampleSelect = (sample: typeof SAMPLES[0]) => {
    setSourceMode('text');
    setPdfBase64(null);
    setPdfFileName(null);
    setBodyText(sample.content);
  };

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const b64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPdfBase64(b64);
      setPdfFileName(asset.name || 'document.pdf');
    } catch (e) {
      Alert.alert('PDF', e instanceof Error ? e.message : 'Could not read PDF');
    }
  };

  const setMode = (m: SourceMode) => {
    setSourceMode(m);
    if (m !== 'pdf') {
      setPdfBase64(null);
      setPdfFileName(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🧠</Text>
          <Text style={styles.headerTitle}>CTA Agent</Text>
          <Text style={styles.headerSubtitle}>
            Transform content into actionable intelligence
          </Text>
        </View>

        {/* ── Input Area ──────────────────────────────────── */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>📥 Input Content</Text>
          <Text style={styles.sectionSubtitle}>
            Text, public HTTPS URL, or PDF — normalized server-side before the Antigravity Manager runs.
          </Text>

          <View style={styles.modeRow}>
            {(['text', 'url', 'pdf'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeChip, sourceMode === m && styles.modeChipOn]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeChipText, sourceMode === m && styles.modeChipTextOn]}>
                  {m === 'text' ? 'Text' : m === 'url' ? 'URL' : 'PDF'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {sourceMode !== 'pdf' ? (
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder={
                  sourceMode === 'url'
                    ? 'https://example.com/news/article…'
                    : 'Paste your content here…'
                }
                placeholderTextColor={COLORS.textMuted}
                value={bodyText}
                onChangeText={setBodyText}
                multiline
                numberOfLines={sourceMode === 'url' ? 3 : 8}
                textAlignVertical="top"
                autoCapitalize={sourceMode === 'url' ? 'none' : 'sentences'}
                keyboardType={sourceMode === 'url' ? 'url' : 'default'}
              />
              <View style={styles.charCount}>
                <Text style={styles.charCountText}>
                  {bodyText.length} characters
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.pdfBox}>
              <TouchableOpacity style={styles.pdfPickBtn} onPress={pickPdf} activeOpacity={0.85}>
                <Ionicons name="document-attach" size={22} color="#fff" />
                <Text style={styles.pdfPickText}>Pick PDF</Text>
              </TouchableOpacity>
              <Text style={styles.pdfHint}>
                {pdfFileName ? `Loaded: ${pdfFileName}` : 'Text is extracted on the server (text-based PDFs work best).'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleAnalyze}
            activeOpacity={0.8}
            disabled={!canRun}
          >
            <LinearGradient
              colors={canRun
                ? ['#6366f1', '#8b5cf6', '#a78bfa']
                : ['#333355', '#333355']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyzeButton}
            >
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.analyzeButtonText}>Run Agent Pipeline</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Sample Content ──────────────────────────────── */}
        <View style={styles.samplesSection}>
          <Text style={styles.sectionTitle}>📦 Sample Content</Text>
          <Text style={styles.sectionSubtitle}>
            Try one of these pre-loaded scenarios
          </Text>

          {SAMPLES.map((sample) => (
            <TouchableOpacity
              key={sample.id}
              style={[
                styles.sampleCard,
                sourceMode === 'text' && bodyText === sample.content && styles.sampleCardActive,
              ]}
              onPress={() => handleSampleSelect(sample)}
              activeOpacity={0.7}
            >
              <View style={styles.sampleHeader}>
                <Text style={styles.sampleIcon}>{sample.icon}</Text>
                <View style={styles.sampleHeaderText}>
                  <Text style={styles.sampleTitle}>{sample.title}</Text>
                  <Text style={styles.sampleDomain}>{sample.domain}</Text>
                </View>
                {sourceMode === 'text' && bodyText === sample.content && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                )}
              </View>
              <Text style={styles.samplePreview} numberOfLines={2}>
                {sample.content.substring(0, 120)}...
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── How It Works ────────────────────────────────── */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>⚡ How It Works</Text>
          <View style={styles.stepsContainer}>
            {[
              { num: '0', title: 'Antigravity Manager', desc: 'Mission, work plan, tool strategy' },
              { num: '1', title: 'Content Understanding', desc: 'Domain, entities, changes' },
              { num: '2', title: 'Insight Extraction', desc: 'Non-obvious, quantified insights' },
              { num: '3', title: 'Impact Analysis', desc: 'Stakeholder consequences' },
              { num: '4', title: 'Action Generation', desc: '3 ranked executable actions' },
              { num: '5', title: 'Execution Simulation', desc: 'Before/after + mock tool bridge' },
              { num: '6', title: 'Outcome Report', desc: 'Executive summary' },
            ].map((step, idx) => (
              <View key={idx} style={styles.stepItem}>
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.stepNumber}
                >
                  <Text style={styles.stepNumberText}>{step.num}</Text>
                </LinearGradient>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: SPACING.xxxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  textAreaContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  textArea: {
    padding: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    minHeight: 180,
    lineHeight: 22,
  },
  charCount: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  charCountText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.glow,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modeChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeChipOn: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
  },
  modeChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modeChipTextOn: {
    color: COLORS.textPrimary,
  },
  pdfBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  pdfPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  pdfPickText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZES.md,
  },
  pdfHint: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  samplesSection: {
    marginBottom: SPACING.xxxl,
  },
  sampleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sampleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
  },
  sampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sampleIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  sampleHeaderText: {
    flex: 1,
  },
  sampleTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sampleDomain: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  samplePreview: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  howItWorks: {
    marginBottom: SPACING.xxxl,
  },
  stepsContainer: {
    gap: SPACING.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stepDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
