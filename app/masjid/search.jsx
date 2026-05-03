/**
 * app/masjid/search.jsx  —  Masjid Search Screen
 * Debounced Firestore / AsyncStorage search with follow action.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import {
  searchMasajid, followMasjid, createLocalMasjid,
} from '../../src/services/masjidService';
import { FIREBASE_CONFIGURED } from '../../src/config/firebaseConfig';

// ─── Create-Masjid Modal ──────────────────────────────────────────────────────

import {
  Modal, Pressable, TextInput as RNInput,
} from 'react-native';

function CreateMasjidModal({ visible, onClose, onCreated }) {
  const [name,    setName]    = useState('');
  const [city,    setCity]    = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Name required');
    setLoading(true);
    try {
      const m = await createLocalMasjid({
        name: name.trim(),
        adminUid: 'local',
        address: { line1: '', city: city.trim(), postcode: '', country: '' },
      });
      onCreated(m);
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={cs.overlay} onPress={onClose}>
        <Pressable style={cs.sheet}>
          <View style={cs.handle} />
          <Text style={cs.title}>➕  Add a New Masjid</Text>
          <Text style={cs.label}>Masjid Name *</Text>
          <RNInput
            style={cs.input} value={name} onChangeText={setName}
            placeholder="e.g. Masjid Al-Noor" placeholderTextColor="#475569"
          />
          <Text style={cs.label}>City</Text>
          <RNInput
            style={cs.input} value={city} onChangeText={setCity}
            placeholder="e.g. London" placeholderTextColor="#475569"
          />
          <TouchableOpacity style={cs.createBtn} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={cs.createBtnText}>Create Masjid</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={cs.cancelBtn} onPress={onClose}>
            <Text style={cs.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const cs = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#0F172A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#334155', alignSelf: 'center', marginBottom: 16 },
  title:    { fontSize: 17, fontWeight: '800', color: '#F1F5F9', marginBottom: 20 },
  label:    { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 6 },
  input:    { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 14, color: '#F1F5F9', fontSize: 14, marginBottom: 14 },
  createBtn:  { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn:  { alignItems: 'center', padding: 10 },
  cancelText: { color: '#64748B', fontSize: 14 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MasjidSearchScreen() {
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [followingId, setFollowingId] = useState(null);
  const [searchErr,   setSearchErr]   = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);
  const debounce = useRef(null);

  // Debounced search
  const handleQuery = useCallback(text => {
    setQuery(text);
    setSearchErr(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (text.trim().length < 2) { setResults([]); setHasSearched(false); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true); setHasSearched(true);
      try {
        setResults(await searchMasajid(text));
      } catch (e) {
        setSearchErr(e instanceof Error ? e.message : 'Search failed. Try again.');
        setResults([]);
      } finally { setSearching(false); }
    }, 400);
  }, []);

  // Follow a masjid
  const handleFollow = useCallback(async item => {
    const auth = getAuth();
    const uid  = FIREBASE_CONFIGURED ? auth.currentUser?.uid : 'local';
    if (!uid) { Alert.alert('Sign in required', 'Please sign in to follow a Masjid.'); return; }
    setFollowingId(item.id);
    try {
      await followMasjid(uid, item.id, item.name);
      Alert.alert('✅ Masjid Followed', `You are now following ${item.name}.`, [
        { text: 'Great!', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not follow masjid.');
    } finally { setFollowingId(null); }
  }, []);

  const renderItem = useCallback(({ item }) => {
    const busy = followingId === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          {item.imageUrl
            ? <Image source={{ uri: item.imageUrl }} style={styles.avatarImg} />
            : <Text style={styles.avatarIcon}>🕌</Text>
          }
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.addr} numberOfLines={1}>
            {item.address?.city || ''}{item.address?.country ? `, ${item.address.country}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.followBtn, busy && styles.followBusy]}
          onPress={() => handleFollow(item)}
          disabled={busy || !!followingId}
        >
          {busy
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.followText}>Follow</Text>
          }
        </TouchableOpacity>
      </View>
    );
  }, [followingId, handleFollow]);

  const Empty = useCallback(() => {
    if (searching) return null;
    if (!hasSearched) return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Find your Masjid</Text>
        <Text style={styles.emptyBody}>Type at least 2 characters to search.</Text>
        {!FIREBASE_CONFIGURED && (
          <TouchableOpacity style={styles.createTrigger} onPress={() => setShowCreate(true)}>
            <Text style={styles.createTriggerText}>➕  Add Masjid (Local Mode)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyIcon}>🕌</Text>
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptyBody}>Try a different name or ask your admin to register.</Text>
        {!FIREBASE_CONFIGURED && (
          <TouchableOpacity style={styles.createTrigger} onPress={() => setShowCreate(true)}>
            <Text style={styles.createTriggerText}>➕  Add Masjid (Local Mode)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [searching, hasSearched]);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search masajid by name…"
            placeholderTextColor="#475569"
            value={query}
            onChangeText={handleQuery}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searching && <ActivityIndicator color="#10B981" size="small" />}
        </View>

        {searchErr && (
          <View style={styles.errBanner}>
            <Text style={styles.errText}>⚠️  {searchErr}</Text>
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          ListEmptyComponent={Empty}
          contentContainerStyle={results.length === 0 ? styles.listEmpty : styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </KeyboardAvoidingView>

      <CreateMasjidModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={m => handleFollow(m)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', margin: 16,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: '#1E293B', borderRadius: 14, borderWidth: 1, borderColor: '#334155', gap: 10,
  },
  searchIcon:    { fontSize: 18 },
  searchInput:   { flex: 1, fontSize: 15, color: '#F1F5F9' },
  errBanner:     { marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: '#450A0A', borderRadius: 10 },
  errText:       { color: '#FCA5A5', fontSize: 12 },
  list:          { paddingHorizontal: 16, paddingBottom: 32 },
  listEmpty:     { flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1E293B', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  avatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg:   { width: 52, height: 52 },
  avatarIcon:  { fontSize: 26 },
  info:        { flex: 1 },
  name:        { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  addr:        { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  followBtn:   { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minWidth: 72, alignItems: 'center' },
  followBusy:  { backgroundColor: '#059669', opacity: 0.8 },
  followText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyIcon:   { fontSize: 52, marginBottom: 8 },
  emptyTitle:  { fontSize: 18, fontWeight: '800', color: '#F1F5F9', textAlign: 'center' },
  emptyBody:   { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  createTrigger: { marginTop: 16, backgroundColor: '#1E293B', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: '#334155' },
  createTriggerText: { color: '#10B981', fontWeight: '700', fontSize: 14 },
});
