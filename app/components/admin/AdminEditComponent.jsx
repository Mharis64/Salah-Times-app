/**
 * AdminEditComponent.jsx
 * Time-picker card shown to Masjid admins on the Manage screen.
 * Uses @react-native-community/datetimepicker for iOS/Android native pickers.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, Platform, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateJamatTimes } from '../../../src/services/masjidService';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const ICONS   = { Fajr: '🌙', Dhuhr: '☀️', Asr: '🌤', Maghrib: '🌆', Isha: '🌃' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTimeString(str) {
  const date  = new Date();
  try {
    const [time, mer] = str.split(' ');
    const [h, m]      = time.split(':').map(Number);
    let hours = h % 12;
    if (mer?.toUpperCase() === 'PM') hours += 12;
    date.setHours(hours, m, 0, 0);
  } catch { date.setHours(0, 0, 0, 0); }
  return date;
}

function formatDate(date) {
  let h = date.getHours();
  const m  = date.getMinutes();
  const mer = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} ${mer}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminEditComponent({ masjidId, currentTimes, onSaveSuccess }) {
  const [draft,    setDraft]    = useState({ ...currentTimes });
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState(null);
  const [active,   setActive]   = useState(null);   // which prayer is in the picker
  const [pickDate, setPickDate] = useState(new Date());

  const openPicker = useCallback(prayer => {
    setPickDate(parseTimeString(draft[prayer]));
    setActive(prayer);
  }, [draft]);

  const onPickerChange = useCallback((_evt, selected) => {
    if (Platform.OS === 'android') {
      setActive(null);
      if (selected && active) {
        setDraft(prev => ({ ...prev, [active]: formatDate(selected) }));
      }
      return;
    }
    if (selected) setPickDate(selected);
  }, [active]);

  const confirmIOS = useCallback(() => {
    if (active) setDraft(prev => ({ ...prev, [active]: formatDate(pickDate) }));
    setActive(null);
  }, [active, pickDate]);

  const handleSave = useCallback(async () => {
    setSaving(true); setSaveErr(null);
    try {
      await updateJamatTimes(masjidId, {
        Fajr: draft.Fajr, Dhuhr: draft.Dhuhr, Asr: draft.Asr,
        Maghrib: draft.Maghrib, Isha: draft.Isha,
      });
      setEditing(false);
      onSaveSuccess?.();
      Alert.alert('✅ Saved', 'Jamat times updated successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      setSaveErr(msg);
      Alert.alert('❌ Save Failed', msg);
    } finally { setSaving(false); }
  }, [masjidId, draft, onSaveSuccess]);

  const handleCancel = useCallback(() => {
    setDraft({ ...currentTimes });
    setSaveErr(null);
    setEditing(false);
  }, [currentTimes]);

  return (
    <View style={styles.container}>
      {/* Card header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🕌  Jamat Times</Text>
        {!editing && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Last updated */}
      {currentTimes?.lastUpdated && (
        <Text style={styles.lastUpdated}>
          Last updated:{' '}
          {typeof currentTimes.lastUpdated === 'string'
            ? new Date(currentTimes.lastUpdated).toLocaleString()
            : currentTimes.lastUpdated?.toDate?.()?.toLocaleString() ?? ''}
        </Text>
      )}

      {/* Prayer rows */}
      {PRAYERS.map(prayer => (
        <View key={prayer} style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>{ICONS[prayer]}</Text>
            <Text style={styles.rowName}>{prayer}</Text>
          </View>
          {editing ? (
            <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker(prayer)}>
              <Text style={styles.timeBtnText}>{draft[prayer]}</Text>
              <Text style={styles.timeBtnChev}>›</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timeDisplay}>{draft[prayer]}</Text>
          )}
        </View>
      ))}

      {/* Error */}
      {saveErr && (
        <View style={styles.errBanner}>
          <Text style={styles.errText}>⚠️  {saveErr}</Text>
        </View>
      )}

      {/* Action buttons */}
      {editing && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave} disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveText}>Save Changes</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* DateTimePicker */}
      {active !== null && (
        <>
          <DateTimePicker
            value={pickDate}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onPickerChange}
            style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.iosDone} onPress={confirmIOS}>
              <Text style={styles.iosDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const C = { bg: '#1E293B', border: '#334155', accent: '#10B981', dark: '#059669', text: '#F1F5F9', sub: '#94A3B8' };

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.bg, borderRadius: 20, padding: 20,
    marginHorizontal: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: C.text },
  editBtn:       { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  editBtnText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  lastUpdated:   { fontSize: 10, color: C.sub, marginBottom: 14, fontStyle: 'italic' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rowLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon:     { fontSize: 20, width: 26, textAlign: 'center' },
  rowName:     { fontSize: 15, fontWeight: '700', color: C.text },
  timeDisplay: { fontSize: 15, fontWeight: '800', color: C.accent, fontVariant: ['tabular-nums'] },
  timeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0F172A', borderWidth: 1, borderColor: C.accent,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  timeBtnText: { fontSize: 14, fontWeight: '800', color: C.accent, fontVariant: ['tabular-nums'] },
  timeBtnChev: { color: C.accent, fontSize: 18 },
  errBanner:   { backgroundColor: '#7F1D1D', borderRadius: 10, padding: 12, marginTop: 12 },
  errText:     { color: '#FCA5A5', fontSize: 12 },
  actionRow:   { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: {
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#334155', minWidth: 100, alignItems: 'center',
  },
  cancelText: { color: C.sub, fontWeight: '700', fontSize: 14 },
  saveBtn: {
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: C.accent, minWidth: 130, alignItems: 'center',
  },
  saveText:    { color: '#fff', fontWeight: '800', fontSize: 14 },
  iosPicker:   { backgroundColor: '#0F172A', marginTop: 8, borderRadius: 12 },
  iosDone:     { alignSelf: 'flex-end', padding: 10, marginTop: 4 },
  iosDoneText: { color: C.accent, fontWeight: '800', fontSize: 15 },
});
