import { useState, useEffect, useCallback } from 'react'
import * as adhan from 'adhan'

const MADHAB_OPTIONS = [
  { value: 'Shafi',   label: "Shafi'i / Maliki / Hanbali",  madhab: adhan.Madhab.Shafi   },
  { value: 'Hanafi',  label: 'Hanafi',                       madhab: adhan.Madhab.Hanafi  },
]

const CALC_METHOD_OPTIONS = [
  { value: 'MuslimWorldLeague',     label: 'Muslim World League'        },
  { value: 'Egyptian',              label: 'Egyptian Authority'         },
  { value: 'Karachi',               label: 'University of Islamic Sci.' },
  { value: 'UmmAlQura',             label: 'Umm al-Qura (Makkah)'      },
  { value: 'Dubai',                 label: 'Dubai'                      },
  { value: 'Qatar',                 label: 'Qatar'                      },
  { value: 'Kuwait',                label: 'Kuwait'                     },
  { value: 'Singapore',             label: 'Singapore'                  },
  { value: 'NorthAmerica',          label: 'ISNA (North America)'       },
  { value: 'MoonsightingCommittee', label: 'Moonsighting Committee'     },
]

function getParams(calcMethodValue, madhabValue) {
  const method  = adhan.CalculationMethod[calcMethodValue]?.()
                  ?? adhan.CalculationMethod.MuslimWorldLeague()
  const madhab  = MADHAB_OPTIONS.find(m => m.value === madhabValue)?.madhab
                  ?? adhan.Madhab.Shafi
  method.madhab = madhab
  return method
}

function fmt(date) {
  if (!date) return '--:--'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
}

function getNextPrayer(times) {
  if (!times) return null
  const now = new Date()
  const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  for (const name of order) {
    if (times[name] > now) return name
  }
  return 'fajr' // next day
}

function getCountdown(targetDate) {
  if (!targetDate) return null
  const diff = targetDate - new Date()
  if (diff < 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function usePrayerTimes() {
  const [location,    setLocation]    = useState(null)
  const [cityName,    setCityName]    = useState('Locating…')
  const [prayerTimes, setPrayerTimes] = useState(null)
  const [error,       setError]       = useState(null)
  const [madhab,      setMadhab]      = useState('Shafi')
  const [calcMethod,  setCalcMethod]  = useState('MuslimWorldLeague')
  const [now,         setNow]         = useState(new Date())
  const [loading,     setLoading]     = useState(true)

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Get GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      err => {
        setError('Location access denied. Using Mecca as default.')
        setLocation({ lat: 21.3891, lng: 39.8579 })
        setCityName('Mecca, Saudi Arabia')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Reverse geocode
  useEffect(() => {
    if (!location) return
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`)
      .then(r => r.json())
      .then(data => {
        const addr = data.address
        const city = addr.city || addr.town || addr.village || addr.county || 'Unknown'
        const country = addr.country || ''
        setCityName(`${city}, ${country}`)
      })
      .catch(() => setCityName('Your Location'))
  }, [location])

  // Calculate prayer times
  useEffect(() => {
    if (!location) return
    const date   = new Date()
    const coords = new adhan.Coordinates(location.lat, location.lng)
    const params = getParams(calcMethod, madhab)
    const times  = new adhan.PrayerTimes(coords, date, params)
    setPrayerTimes(times)
  }, [location, madhab, calcMethod])

  const nextPrayer = prayerTimes ? getNextPrayer(prayerTimes) : null
  const nextTime   = prayerTimes && nextPrayer ? prayerTimes[nextPrayer] : null
  const countdown  = getCountdown(nextTime)

  return {
    location,
    cityName,
    prayerTimes,
    error,
    madhab,
    setMadhab,
    calcMethod,
    setCalcMethod,
    now,
    nextPrayer,
    countdown,
    loading,
    madhabOptions:      MADHAB_OPTIONS,
    calcMethodOptions:  CALC_METHOD_OPTIONS,
    fmt,
  }
}
