/**
 * masjidService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-mode service:
 *   • When Firebase IS configured  → reads/writes Firestore and listens live
 *   • When Firebase is NOT configured → stores everything in AsyncStorage
 *
 * The UI never needs to know which mode is active.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection, doc, getDoc, getDocs, updateDoc,
  setDoc, deleteField, serverTimestamp, onSnapshot,
  query, where, orderBy, limit, FirestoreError,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, FIREBASE_CONFIGURED } from '../config/firebaseConfig';

// ─── AsyncStorage keys ────────────────────────────────────────────────────────
const AS_MASAJID_KEY      = '@salah:masajid';        // local masajid store
const AS_FOLLOWED_KEY     = '@salah:followedMasjid'; // user preference

// ─── Error normaliser ─────────────────────────────────────────────────────────
function normaliseError(err, context) {
  if (err && err.code) {
    const map = {
      'permission-denied': 'Permission denied. Make sure you are the Masjid admin.',
      'unavailable':       'Network unavailable. Check your connection and try again.',
      'not-found':         'Masjid not found.',
    };
    throw new Error(`[${context}] ${map[err.code] || err.message}`);
  }
  throw new Error(`[${context}] ${err instanceof Error ? err.message : String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOCAL HELPERS (AsyncStorage mode)
// ─────────────────────────────────────────────────────────────────────────────

async function localGetAll() {
  try {
    const raw = await AsyncStorage.getItem(AS_MASAJID_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function localSaveAll(map) {
  await AsyncStorage.setItem(AS_MASAJID_KEY, JSON.stringify(map));
}

async function localGetMasjid(id) {
  const map = await localGetAll();
  const m = map[id];
  if (!m) throw new Error('[getMasjid] Masjid not found.');
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch a single Masjid by ID */
export async function getMasjid(id) {
  if (!FIREBASE_CONFIGURED) return localGetMasjid(id);
  try {
    const snap = await getDoc(doc(collection(db, 'masajid'), id));
    if (!snap.exists()) throw { code: 'not-found' };
    return { id: snap.id, ...snap.data() };
  } catch (err) { normaliseError(err, 'getMasjid'); }
}

/**
 * Update Jamat times.
 * @param {string} masjidId
 * @param {{ Fajr, Dhuhr, Asr, Maghrib, Isha }} times  12-hour strings
 */
export async function updateJamatTimes(masjidId, times) {
  if (!FIREBASE_CONFIGURED) {
    // Local mode: update AsyncStorage
    const map = await localGetAll();
    if (!map[masjidId]) throw new Error('Masjid not found locally.');
    map[masjidId] = {
      ...map[masjidId],
      jamatTimes: { ...times, lastUpdated: new Date().toISOString(), lastUpdatedBy: 'local' },
    };
    await localSaveAll(map);
    return;
  }
  const auth = getAuth();
  if (!auth.currentUser) throw new Error('You must be signed in to update times.');
  try {
    await updateDoc(doc(collection(db, 'masajid'), masjidId), {
      'jamatTimes.Fajr':         times.Fajr,
      'jamatTimes.Dhuhr':        times.Dhuhr,
      'jamatTimes.Asr':          times.Asr,
      'jamatTimes.Maghrib':      times.Maghrib,
      'jamatTimes.Isha':         times.Isha,
      'jamatTimes.lastUpdated':  serverTimestamp(),
      'jamatTimes.lastUpdatedBy': auth.currentUser.uid,
    });
  } catch (err) { normaliseError(err, 'updateJamatTimes'); }
}

/**
 * Search masajid by name token.
 * @param {string} queryText
 * @returns {Promise<Array>}
 */
export async function searchMasajid(queryText, maxResults = 20) {
  const token = queryText.trim().toLowerCase();
  if (token.length < 2) return [];

  if (!FIREBASE_CONFIGURED) {
    // Local mode: search in AsyncStorage
    const map = await localGetAll();
    return Object.values(map)
      .filter(m => m.name.toLowerCase().includes(token))
      .slice(0, maxResults)
      .map(({ id, name, address, imageUrl }) => ({ id, name, address, imageUrl }));
  }

  try {
    const q = query(
      collection(db, 'masajid'),
      where('searchKeywords', 'array-contains', token),
      orderBy('name'),
      limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) { normaliseError(err, 'searchMasajid'); }
}

/**
 * Attach a real-time listener. Returns an unsubscribe function.
 * In local mode, calls onUpdate once immediately, returns a no-op unsubscribe.
 */
export function listenToMasjid(masjidId, onUpdate, onError) {
  if (!FIREBASE_CONFIGURED) {
    localGetMasjid(masjidId)
      .then(onUpdate)
      .catch(err => onError(err instanceof Error ? err : new Error(String(err))));
    // Return no-op unsubscribe
    return () => {};
  }
  return onSnapshot(
    doc(collection(db, 'masajid'), masjidId),
    snap => {
      try {
        if (!snap.exists()) throw new Error('Masjid not found.');
        onUpdate({ id: snap.id, ...snap.data() });
      } catch (e) { onError(e); }
    },
    err => onError(new Error(
      err.code === 'permission-denied'
        ? 'Permission denied listening to Masjid updates.'
        : `Listener error: ${err.message}`
    )),
  );
}

/** Save the user's followed Masjid preference */
export async function followMasjid(uid, masjidId, masjidName) {
  const pref = { masjidId, masjidName, followedAt: new Date().toISOString() };
  if (!FIREBASE_CONFIGURED) {
    await AsyncStorage.setItem(AS_FOLLOWED_KEY, JSON.stringify(pref));
    return;
  }
  try {
    await setDoc(
      doc(collection(db, 'users'), uid),
      { followedMasjid: { ...pref, followedAt: serverTimestamp() } },
      { merge: true },
    );
  } catch (err) { normaliseError(err, 'followMasjid'); }
}

/** Remove the followed Masjid preference */
export async function unfollowMasjid(uid) {
  if (!FIREBASE_CONFIGURED) {
    await AsyncStorage.removeItem(AS_FOLLOWED_KEY);
    return;
  }
  try {
    await updateDoc(doc(collection(db, 'users'), uid), { followedMasjid: deleteField() });
  } catch (err) { normaliseError(err, 'unfollowMasjid'); }
}

/** Get saved followed Masjid preference */
export async function getFollowedMasjid(uid) {
  if (!FIREBASE_CONFIGURED) {
    const raw = await AsyncStorage.getItem(AS_FOLLOWED_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  try {
    const snap = await getDoc(doc(collection(db, 'users'), uid));
    return snap.exists() ? (snap.data()?.followedMasjid ?? null) : null;
  } catch (err) { normaliseError(err, 'getFollowedMasjid'); }
}

/**
 * Create a new Masjid locally (for demo/no-Firebase mode).
 * In Firebase mode this would be done via Firebase Admin or a Cloud Function.
 */
export async function createLocalMasjid(masjid) {
  const id = `local_${Date.now()}`;
  const map = await localGetAll();
  map[id] = {
    ...masjid,
    id,
    createdAt: new Date().toISOString(),
    searchKeywords: masjid.name.toLowerCase().split(/[\s\-]+/).filter(t => t.length > 1),
    jamatTimes: {
      Fajr: '05:30 AM', Dhuhr: '01:15 PM', Asr: '04:30 PM',
      Maghrib: '07:00 PM', Isha: '09:00 PM',
      lastUpdated: null, lastUpdatedBy: null,
    },
  };
  await localSaveAll(map);
  return map[id];
}
