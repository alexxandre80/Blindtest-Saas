import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authClient } from '../../lib/auth.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) return setError(error.message)
    setSent(true)
  }

  if (sent) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h2 style={{ margin: '0 0 12px' }}>Email envoyé</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            Si un compte existe pour <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>, tu recevras un lien de réinitialisation.
          </p>
          <Link to="/login" style={s.link}>Retour à la connexion</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Mot de passe oublié</h1>
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="email"
            placeholder="Ton adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={s.input}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? '…' : 'Envoyer le lien'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <Link to="/login" style={s.link}>Retour à la connexion</Link>
        </p>
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
  link: { color: 'var(--color-secondary)' },
}
