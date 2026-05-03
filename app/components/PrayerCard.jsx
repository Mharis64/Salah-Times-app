const PRAYER_META = {
  fajr:    { ar: 'الفجر',  en: 'Fajr',    icon: '🌙', accent: '#818cf8', dot: '#818cf8' },
  dhuhr:   { ar: 'الظهر',  en: 'Dhuhr',   icon: '☀️',  accent: '#fbbf24', dot: '#fbbf24' },
  asr:     { ar: 'العصر',  en: 'Asr',     icon: '🌤',  accent: '#fb923c', dot: '#fb923c' },
  maghrib: { ar: 'المغرب', en: 'Maghrib', icon: '🌆', accent: '#f87171', dot: '#f87171' },
  isha:    { ar: 'العشاء', en: "Isha'a",  icon: '🌃', accent: '#60a5fa', dot: '#60a5fa' },
}

const DISPLAY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

export default function PrayerCard({ prayerTimes, nextPrayer, fmt, animClass = 'animate-float-delayed' }) {
  return (
    <div className={`glass-card-dark p-5 w-full ${animClass}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400/30 to-orange-500/20
                        border border-amber-400/25 flex items-center justify-center">
          <span className="text-sm">🕌</span>
        </div>
        <h2 className="text-white/85 font-semibold text-sm uppercase tracking-widest">Prayer Times</h2>
      </div>

      {/* Prayer rows */}
      <div className="space-y-1.5">
        {DISPLAY_PRAYERS.map(key => {
          const meta   = PRAYER_META[key]
          const time   = prayerTimes ? fmt(prayerTimes[key]) : '--:--'
          const isNext = key === nextPrayer

          return (
            <div
              key={key}
              className={`prayer-row ${isNext ? 'active' : ''}`}
              aria-label={`${meta.en} prayer time: ${time}`}
            >
              {/* Left */}
              <div className="flex items-center gap-3">
                {/* Dot / icon */}
                <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {isNext ? (
                    <>
                      <span className="ping-slow absolute w-3 h-3 rounded-full opacity-75"
                            style={{ background: meta.dot }} />
                      <span className="relative w-2 h-2 rounded-full"
                            style={{ background: meta.dot }} />
                    </>
                  ) : (
                    <span className="text-base leading-none">{meta.icon}</span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <span className="text-white/88 font-semibold text-sm">{meta.en}</span>
                  <span className="ml-2 text-white/28 text-xs font-arabic leading-none">{meta.ar}</span>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isNext && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full
                                   border border-indigo-400/40 text-indigo-300"
                        style={{ background: 'rgba(99,102,241,0.18)' }}>
                    Next
                  </span>
                )}
                <span className={`font-bold text-sm tabular-nums ${isNext ? 'glow-text text-yellow-300' : 'text-white/70'}`}>
                  {time}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between">
        <p className="text-white/25 text-xs">Times for today</p>
        <p className="text-white/25 text-xs">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
