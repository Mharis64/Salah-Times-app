/**
 * MasjidSection.jsx
 * Shown on HomeScreen. Displays followed Masjid's live Jamat times
 * or a "Find a Masjid" call-to-action when none is followed.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getFollowedMasjid } from '../../src/services/masjidService';
import { useMasjid } from '../hooks/useMasjid';
import { FIREBASE_CONFIGURED } from '../../src/config/firebaseConfig';

const PRAYERS = [
  { key: 'Fajr',    icon: '🌙' },
  { key: 'Dhuhr',   icon: '☀️'  },
  { key: 'Asr',     icon: '🌤' },
  { key: 'Maghrib', icon: '🌆' },
  { key: 'Isha',    icon: '🌃' },
];

export default function MasjidSection() {
  const [preference, setPref]     = useState(null);
  const [prefLoading, setPrefLd]  = useState(true);

  // Get followed masjid preference
  useEffect(() => {
    const auth = getAuth();
    const uid  = FIREBASE_CONFIGURED ? auth.currentUser?.uid : 'local';
    if (!uid) { setPrefLd(false); return; }
    getFollowedMasjid(uid)
      .then(setPref)
      .catch(() => setPref(null))
      .finally(() => setPrefLd(false));
  }, []);

  const adminUid = FIREBASE_CONFIGURED ? getAuth().currentUser?.uid : null;
  const { masjid, loading: masjidLoading, error } = useMasjid(preference?.masjidId, adminUid);

  const refresh = useCallback(() => {
    setPrefLd(true);
    const auth = getAuth();
    const uid  = FIREBASE_CONFIGURED ? auth.currentUser?.uid : 'local';
    if (!uid) { setPrefLd(false); return; }
    getFollowedMasjid(uid).then(setPref).catch(() => setPref(null)).finally(() => setPrefLd(false));
  }, []);

  // ── Loading preference ──
  if (prefLoading) {
    return (
      <View style={styles.loadBox}>
        <ActivityIndicator color="#10B981" />
      </View>
    );
  }

  // ── No masjid → CTA ──
  if (!preference) {
    return (
      <View style={styles.ctaCard}>
        <Text style={styles.ctaIcon}>🕌</Text>
        <Text style={styles.ctaTitle}>My Masjid</Text>
        <Text style={styles.ctaBody}>
          Follow a Masjid to see live congregation{'\n'}prayer (Jamat) times right here.
        </Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/masjid/search')}
          accessibilityLabel="Find a Masjid to follow"
        >
          <Text style={styles.ctaBtnText}>🔍  Find a Masjid</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading masjid data ──
  if (masjidLoading) {
    return (
      <View style={styles.loadBox}>
        <ActivityIndicator color="#10B981" />
        <Text style={styles.loadText}>Loading Jamat times…</Text>
      </View>
    );
  }

  if (error || !masjid) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>⚠️  {error || 'Masjid data unavailable'}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardLabel}>MY MASJID</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>{masjid.name}</Text>
          {masjid.address && (
            <Text style={styles.cardAddr} numberOfLines={1}>
              {masjid.address.city}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => router.push(`/masjid/${masjid.id}`)}
          accessibilityLabel={`Manage ${masjid.name}`}
        >
          <Text style={styles.manageBtnText}>Manage →</Text>
        </TouchableOpacity>
      </View>

      {/* 5-column prayer grid */}
      <View style={styles.grid}>
        {PRAYERS.map(p => (
          <View key={p.key} style={styles.gridCell}>
            <Text style={styles.gridIcon}>{p.icon}</Text>
            <Text style={styles.gridName}>{p.key}</Text>
            <Text style={styles.gridTime}>{masjid.jamatTimes?.[p.key] ?? '--:--'}</Text>
          </View>
        ))}
      </View>

      {/* Last updated */}
      {masjid.jamatTimes?.lastUpdated && (
        <Text style={styles.lastUpdated}>
          Updated{' '}
          {typeof masjid.jamatTimes.lastUpdated === 'string'
            ? new Date(masjid.jamatTimes.lastUpdated).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
            : masjid.jamatTimes.lastUpdated?.toDate?.()?.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
          }
        </Text>
      )}
    </View>
  );
}

const C = { bg: '#0F172A', card: '#1E293B', border: '#334155', accent: '#10B981', text: '#F1F5F9', sub: '#94A3B8' };

const styles = StyleSheet.create({
  loadBox:    { alignItems: 'center', padding: 24, gap: 8 },
  loadText:   { color: C.sub, fontSize: 12 },

  ctaCard: {
    margin: 16, padding: 28, backgroundColor: C.card, borderRadius: 20,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
    borderStyle: 'dashed', gap: 8,
  },
  ctaIcon:  { fontSize: 48, marginBottom: 4 },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  ctaBody:  { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 20 },
  ctaBtn: {
    marginTop: 12, backgroundColor: C.accent,
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 26,
  },
  ctaBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  errorCard: {
    margin: 16, padding: 16, backgroundColor: '#450A0A', borderRadius: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  errorText: { color: '#FCA5A5', fontSize: 12, flex: 1 },
  retryBtn:  { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#7F1D1D', borderRadius: 8, marginLeft: 8 },
  retryText: { color: '#FCA5A5', fontSize: 12, fontWeight: '700' },

  card: {
    marginHorizontal: 16, marginBottom: 20, backgroundColor: C.card,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cardLabel: { fontSize: 10, fontWeight: '800', color: C.accent, letterSpacing: 1.6, marginBottom: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  cardAddr:  { fontSize: 11, color: C.sub, marginTop: 1 },
  manageBtn: {
    backgroundColor: '#0F172A', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  manageBtnText: { color: C.accent, fontWeight: '800', fontSize: 13 },

  grid: { flexDirection: 'row', paddingVertical: 4 },
  gridCell: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  gridIcon: { fontSize: 20 },
  gridName: { fontSize: 9, fontWeight: '700', color: C.sub, letterSpacing: 0.4 },
  gridTime: { fontSize: 11, fontWeight: '900', color: C.accent, fontVariant: ['tabular-nums'] },

  lastUpdated: { fontSize: 10, color: C.sub, textAlign: 'center', paddingBottom: 10, fontStyle: 'italic' },
});
