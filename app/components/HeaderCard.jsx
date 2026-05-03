export default function HeaderCard({ cityName, now, countdown, nextPrayer, animClass = 'animate-float' }) {
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
  let hijriStr = ''
  try {
    hijriStr = now.toLocaleDateString('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { hijriStr = '' }

  const nextLabel = nextPrayer
    ? nextPrayer.charAt(0).toUpperCase() + nextPrayer.slice(1)
    : null

  // countdown color: red when < 10 min, amber < 30 min, else gold
  let cdColor = 'text-yellow-300'
  if (countdown) {
    const [h, m] = countdown.split(':').map(Number)
    const totalMin = h * 60 + m
    if (totalMin < 10) cdColor = 'text-red-400'
    else if (totalMin < 30) cdColor = 'text-amber-300'
  }

  return (
    <div className={`glass-card-dark p-5 w-full ${animClass}`}>
      {/* Brand row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-600
                            flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <span className="text-xl">☪</span>
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full
                             border-2 border-black animate-pulse" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight tracking-tight">Salah Times</h1>
            <p className="text-white/35 text-xs font-medium">3D Prayer Companion</p>
          </div>
        </div>
        {/* Live clock */}
        <div className="text-right">
          <div className={`font-bold text-xl tabular-nums leading-none glow-text ${cdColor || 'text-yellow-300'} mb-0.5`}>
            {timeStr}
          </div>
          <div className="text-white/35 text-xs">{dateStr.split(',')[0]}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent mb-4" />

      {/* Location */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30
                        flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">📍</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">{cityName}</p>
          <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{dateStr}</p>
          {hijriStr && (
            <p className="text-indigo-300/50 text-xs mt-0.5 font-arabic">{hijriStr}</p>
          )}
        </div>
      </div>

      {/* Countdown block */}
      {countdown && nextLabel ? (
        <div className="relative rounded-xl overflow-hidden border border-indigo-400/20"
             style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.18) 0%,rgba(139,92,246,0.12) 100%)' }}>
          {/* Shimmer sweep */}
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.04) 50%,transparent 100%)',
                 animation: 'shimmer 3s linear infinite',
                 backgroundSize: '200% 100%',
               }} />
          <div className="relative flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Next Prayer</p>
              <div className="flex items-center gap-2">
                <span className="relative flex w-2 h-2">
                  <span className="ping-slow absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
                </span>
                <p className="text-indigo-200 font-bold text-base">{nextLabel}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Begins in</p>
              <p className={`font-black text-2xl tabular-nums leading-none glow-text ${cdColor}`}>
                {countdown}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 px-4 py-3 text-center">
          <p className="text-white/30 text-xs">Calculating prayer times…</p>
        </div>
      )}
    </div>
  )
}
