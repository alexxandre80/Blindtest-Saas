import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { TEAM_COLORS } from '../../styles/theme.js'

export default function Podium({ entries = [], isTeamMode = false, onReplay }) {
  const [visible, setVisible] = useState([false, false, false])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible((v) => [v[0], v[1], true]), 500)   // 3rd
    const t2 = setTimeout(() => setVisible((v) => [v[0], true, v[2]]), 1200)  // 2nd
    const t3 = setTimeout(() => {
      setVisible([true, true, true]) // 1st + confetti
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } })
    }, 2000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // UI order: 2nd (left) | 1st (center) | 3rd (right)
  const podiumItems = [
    top3[1] ? { entry: top3[1], rank: 2, height: 140, vis: visible[1] } : null,
    top3[0] ? { entry: top3[0], rank: 1, height: 200, vis: visible[0] } : null,
    top3[2] ? { entry: top3[2], rank: 3, height: 100, vis: visible[2] } : null,
  ].filter(Boolean)

  const getColor = (entry) => {
    if (!isTeamMode) return TEAM_COLORS[0]
    const idx = entries.findIndex((e) => e.id === entry.id)
    return TEAM_COLORS[idx % TEAM_COLORS.length]
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        fontFamily: "'Inter', system-ui, sans-serif",
        gap: 32,
      }}
    >
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, textAlign: 'center', margin: 0 }}>
        Partie terminée !
      </h1>

      {top3.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {podiumItems.map(({ entry, rank, height, vis }) => {
            const color = getColor(entry)
            const isFirst = rank === 1
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: vis ? 1 : 0,
                  transform: vis ? 'translateY(0)' : 'translateY(80px)',
                  transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {isFirst && (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="#f59e0b" style={{ marginBottom: 8 }}>
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5z" />
                  </svg>
                )}
                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: isFirst ? 17 : 14, textAlign: 'center', maxWidth: 100 }}>
                  {entry.name}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: isFirst ? 28 : 22, fontWeight: 900, color }}>
                  {entry.score}
                </p>
                <div
                  style={{
                    width: 100,
                    height,
                    background: color,
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: 12,
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.8)' }}>
                    {rank === 1 ? '1er' : rank === 2 ? '2e' : '3e'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ color: 'var(--text-muted)', minWidth: 24 }}>{i + 4}.</span>
              <span style={{ flex: 1 }}>{entry.name}</span>
              <span style={{ fontWeight: 700 }}>{entry.score} pts</span>
            </div>
          ))}
        </div>
      )}

      {onReplay && (
        <button
          onClick={onReplay}
          style={{
            marginTop: 8,
            padding: '14px 40px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
          }}
        >
          Rejouer
        </button>
      )}
    </div>
  )
}
