/**
 * useMasjid.js
 * Real-time (or single-fetch) hook for a Masjid document.
 */

import { useState, useEffect, useCallback } from 'react';
import { listenToMasjid } from '../../src/services/masjidService';
import { FIREBASE_CONFIGURED } from '../../src/config/firebaseConfig';

/**
 * @param {string|null} masjidId
 * @param {string|null} adminUid  pass the signed-in user's UID to check admin status
 */
export function useMasjid(masjidId, adminUid = null) {
  const [masjid,  setMasjid]  = useState(null);
  const [loading, setLoading] = useState(!!masjidId);
  const [error,   setError]   = useState(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!masjidId) {
      setMasjid(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = listenToMasjid(
      masjidId,
      updated => { setMasjid(updated); setLoading(false); },
      err     => { setError(err.message); setLoading(false); },
    );

    return () => (typeof unsub === 'function' ? unsub() : undefined);
  }, [masjidId]);

  const isAdmin = !!(masjid && adminUid && adminUid === masjid.adminUid);

  return { masjid, loading, error, isAdmin, clearError };
}
