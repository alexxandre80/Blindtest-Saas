export default function Timer({ remaining, duration }) {
  const pct = duration > 0 ? Math.max(0, (remaining / duration) * 100) : 100

  const color =
    pct > 50 ? 'var(--timer-green)' :
    pct > 20 ? 'var(--timer-orange)' :
    'var(--timer-red)'

  const isPulsing = remaining <= 3 && remaining > 0

  return (
    <div style={{ width: '100%' }}>
      <div style={{ background: '#2a2a3a', borderRadius: 12, height: 20, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            background: color,
            height: '100%',
            transition: 'width 1s linear, background 0.5s ease',
            animation: isPulsing ? 'pulse 0.5s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      <p
        style={{
          textAlign: 'center',
          fontSize: 48,
          fontWeight: 800,
          margin: '8px 0 0',
          color: isPulsing ? 'var(--timer-red)' : 'var(--text-primary)',
          animation: isPulsing ? 'pulse 0.5s ease-in-out infinite' : 'none',
        }}
      >
        {remaining}s
      </p>
    </div>
  )
}
