import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signIn, signUp } from '../../lib/auth.js'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signUp.email({ name: form.name, email: form.email, password: form.password })
    setLoading(false)
    if (error) return setError(error.message)
    setSuccess(true)
  }

  const handleGoogle = () => {
    signIn.social({ provider: 'google', callbackURL: `${window.location.origin}/dashboard` })
  }

  if (success) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h2 style={{ margin: '0 0 12px' }}>Vérifie ta boîte mail</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            Un email de confirmation a été envoyé à <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>.
          </p>
          <Link to="/login" style={s.link}>Retour à la connexion</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Créer un compte</h1>

        <button onClick={handleGoogle} style={s.googleBtn}>
          Continuer avec Google
        </button>

        <div style={s.divider}>ou</div>

        <form onSubmit={handleSubmit} style={s.form}>
          <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={s.input} />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={s.input} />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} style={s.input} />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? '…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={s.linksP}>
          Déjà un compte ? <Link to="/login" style={s.link}>Se connecter</Link>
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
  googleBtn: { width: '100%', padding: 10, border: '1px solid #2d2d4e', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 },
  divider: { textAlign: 'center', color: 'var(--text-muted)', margin: '14px 0', fontSize: 13 },
  error: { color: 'var(--color-danger)', margin: 0, fontSize: 14 },
  linksP: { textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' },
  link: { color: 'var(--color-secondary)' },
}
