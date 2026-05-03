/**
 * index.jsx — Home Screen
 * Full React Native home screen with:
 *   • Animated gradient header
 *   • Live clock + countdown to next prayer
 *   • Five prayer times cards
 *   • Fiqh settings (madhab / calculation method)
 *   • Masjid Jamat Times section
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Pressable, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePrayerTimesNative, fmt } from './hooks/usePrayerTimesNative';
import MasjidSection from './components/MasjidSection';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRAYERS = [
  { key: 'fajr',    en: 'Fajr',    ar: 'الفجر',  icon: '🌙', accent: '#818cf8' },
  { key: 'dhuhr',   en: 'Dhuhr',   ar: 'الظهر',  icon: '☀️',  accent: '#fbbf24' },
  { key: 'asr',     en: 'Asr',     ar: 'العصر',  icon: '🌤',  accent: '#fb923c' },
  { key: 'maghrib', en: 'Maghrib', ar: 'المغرب', icon: '🌆', accent: '#f87171' },
  { key: 'isha',    en: "Isha'a",  ar: 'العشاء', icon: '🌃', accent: '#60a5fa' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated pulsing dot for the active next-prayer indicator */
function PulseDot({ color }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.8, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.dotRing, { backgroundColor: color, transform: [{ scale: anim }], opacity: 0.4 }]} />
      <View style={[styles.dotCore, { backgroundColor: color }]} />
    </View>
  );
}

/** Single prayer row card */
function PrayerRow({ prayer, time, isNext }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.prayerRow, isNext && styles.prayerRowActive, { opacity: fadeAnim }]}>
      <View style={styles.prayerLeft}>
        {isNext
          ? <PulseDot color={prayer.accent} />
          : <Text style={styles.prayerIcon}>{prayer.icon}</Text>
        }
        <View style={styles.prayerNameWrap}>
          <Text style={styles.prayerEn}>{prayer.en}</Text>
          <Text style={styles.prayerAr}>{prayer.ar}</Text>
        </View>
      </View>
      <View style={styles.prayerRight}>
        {isNext && (
          <View style={[styles.nextBadge, { borderColor: prayer.accent + '60' }]}>
            <Text style={[styles.nextBadgeText, { color: prayer.accent }]}>Next</Text>
          </View>
        )}
        <Text style={[styles.prayerTime, isNext && { color: '#FDE68A' }]}>{time}</Text>
      </View>
    </Animated.View>
  );
}

/** Countdown block */
function CountdownCard({ countdown, nextPrayer, now }) {
  const nextLabel = nextPrayer ? nextPrayer.charAt(0).toUpperCase() + nextPrayer.slice(1) : null;
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  let cdColor = '#FDE68A';
  if (countdown) {
    const [h, m] = countdown.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins < 10) cdColor = '#F87171';
    else if (mins < 30) cdColor = '#FCD34D';
  }

  return (
    <View style={styles.countdownCard}>
      {/* Clock row */}
      <View style={styles.clockRow}>
        <View>
          <Text style={styles.clockLabel}>☪  Salah Times</Text>
          <Text style={styles.clockSub}>3D Islamic Prayer Companion</Text>
        </View>
        <Text style={[styles.clockTime, { color: cdColor }]}>{timeStr}</Text>
      </View>

      <View style={styles.divider} />

      {/* Next prayer countdown */}
      {countdown && nextLabel ? (
        <View style={styles.cdRow}>
          <View>
            <Text style={styles.cdLabel}>NEXT PRAYER</Text>
            <View style={styles.cdNameRow}>
              <View style={styles.cdDot} />
              <Text style={styles.cdName}>{nextLabel}</Text>
            </View>
          </View>
          <View style={styles.cdRight}>
            <Text style={styles.cdLabel}>BEGINS IN</Text>
            <Text style={[styles.cdTime, { color: cdColor }]}>{countdown}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.cdCalculating}>Calculating prayer times…</Text>
      )}
    </View>
  );
}

/** Fiqh settings picker */
function SettingsModal({ visible, onClose, madhab, setMadhab, calcMethod, setCalcMethod, madhabOptions, calcMethodOptions }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>⚖️  Fiqh Settings</Text>

          {/* Madhab */}
          <Text style={styles.settingLabel}>Madhab · School of Law</Text>
          <View style={styles.madhabRow}>
            {madhabOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.madhabBtn, madhab === opt.value && styles.madhabBtnActive]}
                onPress={() => setMadhab(opt.value)}
              >
                <Text style={[styles.madhabBtnText, madhab === opt.value && styles.madhabBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Calculation method */}
          <Text style={[styles.settingLabel, { marginTop: 20 }]}>Calculation Authority</Text>
          <FlatList
            data={calcMethodOptions}
            keyExtractor={i => i.value}
            style={styles.calcList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.calcItem, item.value === calcMethod && styles.calcItemActive]}
                onPress={() => { setCalcMethod(item.value); onClose(); }}
              >
                <Text style={[styles.calcItemText, item.value === calcMethod && styles.calcItemTextActive]}>
                  {item.label}
                </Text>
                {item.value === calcMethod && <Text style={styles.calcCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const {
    cityName, prayerTimes, error,
    madhab, setMadhab, calcMethod, setCalcMethod,
    now, nextPrayer, countdown, loading,
    madhabOptions, calcMethodOptions,
  } = usePrayerTimesNative();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  let hijriStr = '';
  try { hijriStr = now.toLocaleDateString('en-TN-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { hijriStr = ''; }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header banner ── */}
        <View style={styles.headerBanner}>
          <View>
            <View style={styles.locationRow}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationCity} numberOfLines={1}>{cityName}</Text>
            </View>
            <Text style={styles.headerDate}>{dateStr}</Text>
            {hijriStr ? <Text style={styles.headerHijri}>{hijriStr}</Text> : null}
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setSettingsOpen(true)}
            accessibilityLabel="Open Fiqh Settings"
          >
            <Text style={styles.settingsBtnIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Error banner ── */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️  {error}</Text>
          </View>
        )}

        {/* ── Countdown card ── */}
        <CountdownCard countdown={countdown} nextPrayer={nextPrayer} now={now} />

        {/* ── Prayer times card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>🕌  Prayer Times</Text>
            <Text style={styles.cardHeaderSub}>
              {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          {loading ? (
            <Text style={styles.loadingText}>Calculating…</Text>
          ) : (
            PRAYERS.map(p => (
              <PrayerRow
                key={p.key}
                prayer={p}
                time={prayerTimes ? fmt(prayerTimes[p.key]) : '--:--'}
                isNext={p.key === nextPrayer}
              />
            ))
          )}
          <View style={styles.cardFooter}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>adhan.js · GPS live</Text>
            </View>
            <Text style={styles.cardVersion}>v2.0</Text>
          </View>
        </View>

        {/* ── Jamat Times (Masjid section) ── */}
        <MasjidSection />

      </ScrollView>

      {/* ── Settings Modal ── */}
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        madhab={madhab} setMadhab={setMadhab}
        calcMethod={calcMethod} setCalcMethod={setCalcMethod}
        madhabOptions={madhabOptions}
        calcMethodOptions={calcMethodOptions}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg:      '#0F172A',
  card:    '#1E293B',
  border:  '#334155',
  accent:  '#10B981',
  text:    '#F1F5F9',
  sub:     '#94A3B8',
  dim:     '#475569',
};

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  scroll:  { paddingBottom: 40 },

  // Header
  headerBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  locationPin:  { fontSize: 14 },
  locationCity: { fontSize: 16, fontWeight: '700', color: C.text, maxWidth: 250 },
  headerDate:   { fontSize: 12, color: C.sub, marginBottom: 2 },
  headerHijri:  { fontSize: 11, color: '#818CF8', fontStyle: 'italic' },
  settingsBtn:  { padding: 8, borderRadius: 10, backgroundColor: C.card },
  settingsBtnIcon: { fontSize: 20 },

  // Error
  errorBanner: {
    marginHorizontal: 16, marginBottom: 10, padding: 12,
    backgroundColor: '#450A0A', borderRadius: 12,
  },
  errorText: { color: '#FCA5A5', fontSize: 12 },

  // Countdown card
  countdownCard: {
    margin: 16, marginTop: 4, padding: 18, backgroundColor: C.card,
    borderRadius: 20, borderWidth: 1, borderColor: '#334155',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  clockRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clockLabel: { fontSize: 17, fontWeight: '800', color: C.text },
  clockSub:   { fontSize: 11, color: C.sub, marginTop: 2 },
  clockTime:  { fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  divider:    { height: 1, backgroundColor: C.border, marginVertical: 14 },
  cdRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cdLabel:    { fontSize: 9, color: C.sub, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 },
  cdNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cdDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#818CF8' },
  cdName:     { fontSize: 18, fontWeight: '800', color: '#C7D2FE' },
  cdRight:    { alignItems: 'flex-end' },
  cdTime:     { fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  cdCalculating: { color: C.dim, fontSize: 12, textAlign: 'center', paddingVertical: 8 },

  // Prayer card
  card: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: C.card,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cardHeaderText: { fontSize: 14, fontWeight: '700', color: C.text },
  cardHeaderSub:  { fontSize: 12, color: C.sub },
  loadingText:    { color: C.sub, textAlign: 'center', paddingVertical: 20, fontSize: 13 },

  // Prayer row
  prayerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border + '80',
  },
  prayerRowActive: { backgroundColor: 'rgba(99,102,241,0.08)' },
  prayerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayerIcon:      { fontSize: 20, width: 26, textAlign: 'center' },
  prayerNameWrap:  { gap: 1 },
  prayerEn:        { fontSize: 14, fontWeight: '700', color: C.text },
  prayerAr:        { fontSize: 12, color: C.dim },
  prayerRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prayerTime:      { fontSize: 15, fontWeight: '700', color: C.sub, fontVariant: ['tabular-nums'] },
  nextBadge: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  nextBadgeText: { fontSize: 10, fontWeight: '700' },

  // Dot
  dotWrap: { width: 26, height: 26, justifyContent: 'center', alignItems: 'center' },
  dotRing: { position: 'absolute', width: 16, height: 16, borderRadius: 8 },
  dotCore: { width: 8,  height: 8,  borderRadius: 4 },

  // Card footer
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 12,
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { fontSize: 11, color: C.dim },
  cardVersion: { fontSize: 11, color: C.dim },

  // Settings modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0F172A', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle:  { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 20 },
  settingLabel:{ fontSize: 10, fontWeight: '700', color: C.sub, letterSpacing: 1.4, marginBottom: 10 },
  madhabRow:   { flexDirection: 'row', gap: 10 },
  madhabBtn: {
    flex: 1, padding: 12, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center',
  },
  madhabBtnActive: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: C.accent },
  madhabBtnText:   { fontSize: 12, color: C.sub, fontWeight: '600', textAlign: 'center' },
  madhabBtnTextActive: { color: C.accent },
  calcList: { maxHeight: 240, marginBottom: 10 },
  calcItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4,
    backgroundColor: C.card,
  },
  calcItemActive: { backgroundColor: 'rgba(16,185,129,0.15)' },
  calcItemText:   { fontSize: 13, color: C.sub },
  calcItemTextActive: { color: C.accent, fontWeight: '700' },
  calcCheck:  { color: C.accent, fontWeight: '900', fontSize: 16 },
  modalClose: {
    backgroundColor: C.accent, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  modalCloseText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
