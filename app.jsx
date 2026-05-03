import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import EarthCanvas from '../components/EarthCanvas';
import HeaderCard from '../components/HeaderCard';
import PrayerCard from '../components/PrayerCard';
import ControlsCard from '../components/ControlsCard';
import { usePrayerTimes } from '../hooks/usePrayerTimes';

/* ── Loading spinner ────────────────────────────────────────────────── */
function LoadingOverlay() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#818cf8" />
      <Text style={styles.loadingText}>Requesting location…</Text>
      <Text style={styles.loadingSubtext}>Allow GPS for precise prayer times</Text>
    </View>
  );
}

/* ── Error banner ───────────────────────────────────────────────────── */
function ErrorBanner({ message }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

/* ── App ────────────────────────────────────────────────────────────── */
export default function App() {
  const {
    cityName, prayerTimes, error, madhab, setMadhab,
    calcMethod, setCalcMethod, now, nextPrayer, countdown,
    loading, madhabOptions, calcMethodOptions, fmt,
  } = usePrayerTimes();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 3D Earth Canvas */}
      <View style={styles.canvasContainer}>
        <EarthCanvas />
      </View>

      {/* States */}
      {loading && <LoadingOverlay />}
      {error && !loading && <ErrorBanner message={error} />}

      {/* Main UI */}
      {!loading && (
        <View style={styles.uiContainer}>
          <View style={styles.leftPanel}>
            <HeaderCard
              cityName={cityName}
              now={now}
              countdown={countdown}
              nextPrayer={nextPrayer}
            />
            <ControlsCard
              madhab={madhab}
              setMadhab={setMadhab}
              calcMethod={calcMethod}
              setCalcMethod={setCalcMethod}
              madhabOptions={madhabOptions}
              calcMethodOptions={calcMethodOptions}
            />
          </View>

          <View style={styles.rightPanel}>
            <PrayerCard
              prayerTimes={prayerTimes}
              nextPrayer={nextPrayer}
              fmt={fmt}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.35)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    zIndex: 50,
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  errorText: {
    color: 'rgba(251,191,36,0.85)',
    fontSize: 12,
  },
  uiContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    zIndex: 20,
  },
  leftPanel: {
    width: 280,
  },
  rightPanel: {
    width: 280,
  },
});