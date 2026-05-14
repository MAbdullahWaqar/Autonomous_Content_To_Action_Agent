// Settings Screen
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>⚙️ Settings</Text>
      </View>

      <View style={s.content}>
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.email?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={s.email}>{user?.email || 'Unknown'}</Text>
          <Text style={s.uid}>UID: {user?.uid?.substring(0, 12)}...</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>ABOUT</Text>
          <View style={s.infoCard}>
            <InfoRow icon="flash" label="Engine" value="Gemini 1.5 Pro" />
            <InfoRow icon="layers" label="Agents" value="6-stage pipeline" />
            <InfoRow icon="server" label="Backend" value="Next.js API" />
            <InfoRow icon="shield-checkmark" label="Auth" value="Firebase" />
            <InfoRow icon="cloud" label="Storage" value="Cloud Firestore" />
          </View>
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>CTA Agent v1.0.0 • Built with Google Antigravity</Text>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon as any} size={18} color={COLORS.primary} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.lg },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  content: { paddingHorizontal: SPACING.xl },
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xxl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xxl },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  avatarText: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: '#fff' },
  email: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  uid: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.xs },
  section: { marginBottom: SPACING.xxl },
  sectionLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textMuted, marginBottom: SPACING.md, letterSpacing: 1 },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md },
  infoLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', marginBottom: SPACING.xxl },
  signOutText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.error },
  version: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textAlign: 'center' },
});
