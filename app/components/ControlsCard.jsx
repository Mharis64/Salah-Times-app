export default function ControlsCard({
  madhab, setMadhab, calcMethod, setCalcMethod,
  madhabOptions, calcMethodOptions,
  animClass = 'animate-float-slow',
}) {
  return (
    <div className={`glass-card-dark p-5 w-full ${animClass}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400/25 to-orange-500/15
                        border border-amber-400/22 flex items-center justify-center">
          <span className="text-sm">⚖️</span>
        </div>
        <h2 className="text-white/85 font-semibold text-sm uppercase tracking-widest">Fiqh Settings</h2>
      </div>

      <div className="space-y-4">
        {/* ── Madhab toggle ── */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2.5 font-medium">
            Madhab · School of Law
          </p>
          <div className="grid grid-cols-2 gap-2">
            {madhabOptions.map(opt => (
              <button
                key={opt.value}
                id={`madhab-${opt.value.toLowerCase()}`}
                onClick={() => setMadhab(opt.value)}
                aria-pressed={madhab === opt.value}
                className={`madhab-btn ${madhab === opt.value ? 'active' : 'inactive'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Hanafi info banner */}
          {madhab === 'Hanafi' && (
            <div className="mt-2.5 flex items-start gap-2 rounded-xl px-3 py-2.5
                            border border-amber-400/20"
                 style={{ background: 'rgba(251,191,36,0.08)' }}>
              <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">⚡</span>
              <p className="text-amber-200/70 text-xs leading-relaxed">
                Hanafi Asr begins when a shadow is <strong className="text-amber-300">2×</strong> the object height
                (vs 1× for other schools).
              </p>
            </div>
          )}
        </div>

        {/* ── Calculation method ── */}
        <div>
          <label htmlFor="calc-method-select"
                 className="block text-white/40 text-xs uppercase tracking-widest mb-2.5 font-medium">
            Calculation Authority
          </label>
          <select
            id="calc-method-select"
            className="select-glass"
            value={calcMethod}
            onChange={e => setCalcMethod(e.target.value)}
          >
            {calcMethodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-white/25 text-xs">adhan.js · GPS live</p>
        </div>
        <p className="text-white/20 text-xs">v2.0</p>
      </div>
    </div>
  )
}
