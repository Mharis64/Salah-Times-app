/**
 * app/masjid/[id].jsx  —  Manage / View Masjid Screen
 * Shows admin edit UI or read-only Jamat times based on role.
 */

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useMasjid } from '../hooks/useMasjid';
import AdminEditComponent from '../components/admin/AdminEditComponent';
import { unfollowMasjid } from '../../src/services/masjidService';
import { FIREBASE_CONFIGURED } from '../../src/config/firebaseConfig';

const PRAYERS = [
  { key: 'Fajr',    icon: '🌙', accent: '#818cf8' },
  { key: 'Dhuhr',   icon: '☀️',  accent: '#fbbf24' },
  { key: 'Asr',     icon: '🌤',  accent: '#fb923c' },
  { key: 'Maghrib', icon: '🌆', accent: '#f87171' },
  { key: 'Isha',    icon: '🌃', accent: '#60a5fa' },
];

export default function MasjidDetailScreen() {
  const { id } = useLocalSearchParams();
  const auth   = getAuth();
  const uid    = FIREBASE_CONFIGURED ? auth.currentUser?.uid : 'local';
  const { masjid, loading, error, isAdmin } = useMasjid(id, uid);

  const handleUnfollow = async () => {
    try {
      await unfollowMasjid(uid);
      router.back();
    } catch (e) {
      // silent — user still navigated back
      router.back();
    }
  };

  // ── Loading ──
  if (loading) return (
    <View style={styles.centred}>
      <ActivityIndicator color="#10B981" size="large" />
      <Text style={styles.loadText}>Loading Masjid…</Text>
    </View>
  );

  // ── Error ──
  if (error) return (
    <View style={styles.centred}>
      <Text style={styles.errorText}>⚠️  {error}</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (!masjid) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ── Banner ── */}
      <View style={styles.banner}>
        <Text style={styles.bannerName}>{masjid.name}</Text>
        {masjid.address?.city && (
          <Text style={styles.bannerAddr}>
            {masjid.address.line1 ? `${masjid.address.line1}, ` : ''}{masjid.address.city}
          </Text>
        )}
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>👑  Admin</Text>
          </View>
        )}
      </View>

      {/* ── Admin: editable component ── */}
      {isAdmin
        ? <AdminEditComponent masjidId={masjid.id} currentTimes={masjid.jamatTimes} />
        : (
          /* ── User: read-only card ── */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🕌  Jamat Times</Text>
            {PRAYERS.map(p => (
              <View key={p.key} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIcon}>{p.icon}</Text>
                  <Text style={styles.rowName}>{p.key}</Text>
                </View>
                <Text style={[styles.rowTime, { color: p.accent }]}>
                  {masjid.jamatTimes?.[p.key] ?? '--:--'}
                </Text>
              </View>
            ))}
            {masjid.jamatTimes?.lastUpdated && (
              <Text style={styles.lastUpd}>
                Last updated:{' '}
                {typeof masjid.jamatTimes.lastUpdated === 'string'
                  ? new Date(masjid.jamatTimes.lastUpdated).toLocaleString()
                  : masjid.jamatTimes.lastUpdated?.toDate?.()?.toLocaleString() ?? ''}
              </Text>
            )}
          </View>
        )
      }

      {/* ── Unfollow button ── */}
      <TouchableOpacity style={styles.unfollowBtn} onPress={handleUnfollow}>
        <Text style={styles.unfollowText}>Unfollow this Masjid</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const C = { bg: '#0F172A', card: '#1E293B', border: '#334155', accent: '#10B981', text: '#F1F5F9', sub: '#94A3B8' };

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: C.bg },
  content:  { paddingBottom: 50 },
  centred:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, gap: 16, padding: 24 },
  loadText: { color: C.sub, fontSize: 13 },
  errorText:{ color: '#FCA5A5', fontSize: 13, textAlign: 'center' },
  backBtn:  { backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText:{ color: C.accent, fontWeight: '700', fontSize: 14 },

  banner: {
    backgroundColor: C.card, padding: 24, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16,
  },
  bannerName: { fontSize: 22, fontWeight: '900', color: C.text, textAlign: 'center' },
  bannerAddr: { fontSize: 13, color: C.sub, marginTop: 4, textAlign: 'center' },
  adminBadge: { marginTop: 12, backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5 },
  adminBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  card: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: C.card,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.text, padding: 18, borderBottomWidth: 1, borderBottomColor: C.border },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border + '80',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  rowName: { fontSize: 15, fontWeight: '700', color: C.text },
  rowTime: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  lastUpd: { fontSize: 10, color: C.sub, textAlign: 'center', padding: 12, fontStyle: 'italic' },

  unfollowBtn: {
    marginHorizontal: 16, padding: 14, borderRadius: 14,
    backgroundColor: '#450A0A', alignItems: 'center',
  },
  unfollowText: { color: '#FCA5A5', fontWeight: '700', fontSize: 14 },
});
