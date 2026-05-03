/**
 * usePrayerTimesNative.js
 * React Native–compatible version of usePrayerTimes.
 * Uses expo-location instead of navigator.geolocation.
 */

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import * as adhan from 'adhan';

const MADHAB_OPTIONS = [
  { value: 'Shafi',  label: "Shafi'i / Maliki / Hanbali", madhab: adhan.Madhab.Shafi  },
  { value: 'Hanafi', label: 'Hanafi',                      madhab: adhan.Madhab.Hanafi },
];

const CALC_METHOD_OPTIONS = [
  { value: 'MuslimWorldLeague',     label: 'Muslim World League'       },
  { value: 'Egyptian',              label: 'Egyptian Authority'        },
  { value: 'Karachi',               label: 'Univ. of Islamic Sciences' },
  { value: 'UmmAlQura',             label: 'Umm al-Qura (Makkah)'     },
  { value: 'Dubai',                 label: 'Dubai'                     },
  { value: 'Qatar',                 label: 'Qatar'                     },
  { value: 'Kuwait',                label: 'Kuwait'                    },
  { value: 'Singapore',             label: 'Singapore'                 },
  { value: 'NorthAmerica',          label: 'ISNA (North America)'      },
  { value: 'MoonsightingCommittee', label: 'Moonsighting Committee'    },
];

function buildParams(calcMethodValue, madhabValue) {
  const method  = (adhan.CalculationMethod[calcMethodValue]?.() ?? adhan.CalculationMethod.MuslimWorldLeague());
  method.madhab = MADHAB_OPTIONS.find(m => m.value === madhabValue)?.madhab ?? adhan.Madhab.Shafi;
  return method;
}

export function fmt(date) {
  if (!date) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getNextPrayer(times) {
  if (!times) return null;
  const now   = new Date();
  const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const name of order) {
    if (times[name] > now) return name;
  }
  return 'fajr';
}

function getCountdown(targetDate) {
  if (!targetDate) return null;
  const diff = targetDate - new Date();
  if (diff < 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function usePrayerTimesNative() {
  const [location,    setLocation]    = useState(null);
  const [cityName,    setCityName]    = useState('Locating…');
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [error,       setError]       = useState(null);
  const [madhab,      setMadhab]      = useState('Shafi');
  const [calcMethod,  setCalcMethod]  = useState('MuslimWorldLeague');
  const [now,         setNow]         = useState(new Date());
  const [loading,     setLoading]     = useState(true);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Request GPS permission + get location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location access denied. Showing Mecca times as default.');
          setLocation({ lat: 21.3891, lng: 39.8579 });
          setCityName('Mecca, Saudi Arabia');
          setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (e) {
        setError('Could not get GPS location. Showing Mecca times.');
        setLocation({ lat: 21.3891, lng: 39.8579 });
        setCityName('Mecca, Saudi Arabia');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reverse geocode city name
  useEffect(() => {
    if (!location) return;
    (async () => {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: location.lat, longitude: location.lng });
        if (results?.[0]) {
          const { city, district, country } = results[0];
          setCityName(`${city || district || 'Your City'}, ${country || ''}`);
        }
      } catch {
        setCityName('Your Location');
      }
    })();
  }, [location]);

  // Recalculate prayer times on location / method / madhab change
  useEffect(() => {
    if (!location) return;
    const coords = new adhan.Coordinates(location.lat, location.lng);
    const params = buildParams(calcMethod, madhab);
    setPrayerTimes(new adhan.PrayerTimes(coords, new Date(), params));
  }, [location, madhab, calcMethod]);

  const nextPrayer = prayerTimes ? getNextPrayer(prayerTimes) : null;
  const nextTime   = prayerTimes && nextPrayer ? prayerTimes[nextPrayer] : null;

  return {
    location, cityName, prayerTimes, error,
    madhab, setMadhab, calcMethod, setCalcMethod,
    now, nextPrayer, countdown: getCountdown(nextTime),
    loading, madhabOptions: MADHAB_OPTIONS, calcMethodOptions: CALC_METHOD_OPTIONS,
    fmt,
  };
}
