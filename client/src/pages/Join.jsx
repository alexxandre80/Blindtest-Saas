import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { API } from '../config.js'

export default function Join() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState('form') // 'form' | 'teams'
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [teams, setTeams] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return

    if (step === 'form') {
      setError(null)
      setLoading(true)
      try {
        const res = await fetch(`${API}/api/rooms/${code}/info`)
        const data = await res.json()
        setLoading(false)

        if (!res.ok) {
          setError(data.error || 'Room introuvable')
          return
        }

        if (data.isTeamMode) {
          setTeams(data.teams)
          setStep('teams')
        } else {
          navigate(`/play/${code}`, { state: { playerName: name, teamId: null } })
        }
      } catch {
        setLoading(false)
        setError('Impossible de contacter le serveur')
      }
    } else {
      navigate(`/play/${code}`, { state: { playerName: name, teamId: teamId || null } })
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ marginTop: 0, fontSize: 22, color: 'var(--text-primary)' }}>
          Rejoindre une partie
        </h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          {step === 'form' && (
            <>
              <input
                placeholder="Code de la partie"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                required
                maxLength={6}
                style={{ ...styles.input, letterSpacing: 4, textAlign: 'center', fontWeight: 700, fontSize: 18 }}
                autoFocus={!searchParams.get('code')}
              />
              <input
                placeholder="Ton prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={20}
                style={styles.input}
                autoFocus={!!searchParams.get('code')}
              />
            </>
          )}

          {step === 'teams' && (
            <>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                Choisis ton équipe pour la room <strong style={{ color: 'var(--text-primary)' }}>{code}</strong> :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teams.map((team) => (
                  <label
                    key={team.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      border: `2px solid ${teamId === team.id ? 'var(--color-primary)' : '#2d2d4e'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      background: teamId === team.id ? '#1a0f2e' : 'var(--bg-card)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={team.id}
                      checked={teamId === team.id}
                      onChange={() => setTeamId(team.id)}
                    />
                    <span style={{ fontWeight: 600 }}>{team.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? '…' : step === 'form' ? 'Continuer' : 'Rejoindre !'}
          </button>

          {step === 'teams' && (
            <button
              type="button"
              onClick={() => { setStep('form'); setError(null) }}
              style={{ ...styles.btn, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid #2d2d4e' }}
            >
              Retour
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: 16,
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-lg)',
    padding: 32,
    width: '100%',
    maxWidth: 360,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '10px 12px',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-sm)',
    fontSize: 16,
    outline: 'none',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
  },
  btn: {
    padding: '12px 16px',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
  },
  error: { color: 'var(--color-danger)', margin: 0, fontSize: 14 },
}
