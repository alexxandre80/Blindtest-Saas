import { useState } from 'react'

const CONFIGS = {
  idle:     { bg: 'var(--color-primary)', color: '#fff',                    label: 'BUZZ !',        shadow: '0 8px 32px rgba(124,58,237,0.5)', disabled: false },
  waiting:  { bg: 'var(--bg-card)',       color: 'var(--text-secondary)',   label: 'En attente…',  shadow: 'none',                             disabled: true  },
  correct:  { bg: 'var(--color-success)', color: '#fff',                    label: '✓ Correct !',  shadow: '0 8px 32px rgba(16,185,129,0.4)',  disabled: true  },
  denied:   { bg: 'var(--color-danger)',  color: '#fff',                    label: '✗ Raté !',     shadow: '0 8px 32px rgba(239,68,68,0.4)',   disabled: true  },
  disabled: { bg: 'var(--bg-card)',       color: 'var(--text-muted)',       label: 'BUZZ !',        shadow: 'none',                             disabled: true  },
}

export default function BuzzerButton({ state = 'idle', onClick }) {
  const [popping, setPopping] = useState(false)

  const handleClick = () => {
    if (state !== 'idle') return
    setPopping(true)
    setTimeout(() => setPopping(false), 300)
    onClick?.()
  }

  const cfg = CONFIGS[state] ?? CONFIGS.idle

  return (
    <button
      onClick={handleClick}
      disabled={cfg.disabled}
      style={{
        width: '100%',
        minHeight: 160,
        fontSize: '2.5rem',
        fontWeight: 800,
        border: 'none',
        borderRadius: 'var(--radius-xl)',
        background: cfg.bg,
        color: cfg.color,
        cursor: cfg.disabled ? 'not-allowed' : 'pointer',
        opacity: state === 'disabled' ? 0.4 : 1,
        animation: popping ? 'buzzerPop 0.3s ease forwards' : 'none',
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
        boxShadow: cfg.shadow,
        letterSpacing: '0.05em',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      {cfg.label}
    </button>
  )
}
