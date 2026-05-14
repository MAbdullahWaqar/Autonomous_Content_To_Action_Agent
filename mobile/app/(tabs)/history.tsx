// History Screen — Shows saved pipeline reports
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getReports, deleteReportApi, type ReportDocument } from '@/lib/api';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, getUrgencyColor } from '@/lib/theme';

export default function HistoryScreen() {
  const [reports, setReports] = useState<ReportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.log('Failed to load reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchReports(); }, [fetchReports]));

  const handleDelete = (id: string) => {
    Alert.alert('Delete Report', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteReportApi(id);
          setReports(prev => prev.filter(r => r.id !== id));
        } catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  const renderItem = ({ item }: { item: ReportDocument }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push({ pathname: '/report/[id]', params: { id: item.id, data: JSON.stringify(item.result) } })}
      activeOpacity={0.7}
    >
      <View style={s.cardHeader}>
        <View style={[s.domainBadge, { borderColor: getUrgencyColor(item.urgency) }]}>
          <Text style={[s.domainText, { color: getUrgencyColor(item.urgency) }]}>{item.domain}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={s.cardInsight} numberOfLines={2}>{item.mainInsight}</Text>
      <Text style={s.cardAction} numberOfLines={1}>🎯 {item.topAction}</Text>
      <View style={s.cardFooter}>
        <Text style={s.cardDate}>{new Date(item.timestamp).toLocaleDateString()}</Text>
        <View style={s.urgencyDot}>
          <View style={[s.dot, { backgroundColor: getUrgencyColor(item.urgency) }]} />
          <Text style={s.urgencyLabel}>{item.urgency}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>📋 Report History</Text>
        <Text style={s.subtitle}>{reports.length} saved reports</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      ) : reports.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyText}>No reports yet</Text>
          <Text style={s.emptySubtext}>Run your first pipeline analysis</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} tintColor={COLORS.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.lg },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  domainBadge: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 2 },
  domainText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  cardInsight: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 22, marginBottom: SPACING.sm },
  cardAction: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.md },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  urgencyDot: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  urgencyLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptySubtext: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
});
