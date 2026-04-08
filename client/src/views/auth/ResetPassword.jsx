import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authClient } from '../../lib/auth.js'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={{ color: 'var(--color-danger)' }}>Lien invalide ou expiré.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/login')
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Nouveau mot de passe</h1>
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={s.input}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? '…' : 'Réinitialiser'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", padding: 16 },
  card: { background: 'var(--bg-surface)', border: '1px solid #2d2d4e', borderRadius: 'var(--radius-lg)', padding: 32, width: '100%', maxWidth: 360 },
  heading: { margin: '0 0 20px', fontSize: 24, fontWeight: 800 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  input: { padding: '10px 12px', border: '1px solid #2d2d4e', borderRadius: 'var(--radius-sm)', fontSize: 15, background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' },
  btn: { padding: 12, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 15, cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 16px rgba(124,58,237,0.35)' },
  error: { color: 'var(--color-danger)', margin: 0, fontSize: 14 },
}
