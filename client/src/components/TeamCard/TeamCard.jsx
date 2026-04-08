import { useState, useEffect } from 'react'

export default function TeamCard({ name, color, score, rank, isLeading, scoreDelta = 0 }) {
  const [showDelta, setShowDelta] = useState(false)

  useEffect(() => {
    if (scoreDelta > 0) {
      setShowDelta(true)
      const t = setTimeout(() => setShowDelta(false), 1200)
      return () => clearTimeout(t)
    }
  }, [score]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        borderLeft: `4px solid ${color}`,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <span style={{ minWidth: 28, fontWeight: 800, color: 'var(--text-secondary)', fontSize: 15 }}>
        #{rank}
      </span>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{name}</span>
        {isLeading && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5z" />
          </svg>
        )}
      </div>

      <span style={{ fontWeight: 800, fontSize: '1.8rem', color }}>{score}</span>

      {showDelta && (
        <span
          style={{
            position: 'absolute',
            right: 16,
            top: -10,
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--color-success)',
            animation: 'floatUp 1.2s ease forwards',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          +1
        </span>
      )}
    </div>
  )
}
