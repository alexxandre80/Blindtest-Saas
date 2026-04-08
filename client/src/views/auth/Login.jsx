import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../../lib/auth.js'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn.email({
      email: form.email,
      password: form.password,
      callbackURL: '/dashboard',
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/dashboard')
  }

  const handleGoogle = () => {
    signIn.social({ provider: 'google', callbackURL: `${window.location.origin}/dashboard` })
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Connexion</h1>

        <button onClick={handleGoogle} style={s.googleBtn}>
          Continuer avec Google
        </button>

        <div style={s.divider}>ou</div>

        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={s.input}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={s.input}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? '…' : 'Se connecter'}
          </button>
        </form>

        <p style={s.links}>
          <Link to="/forgot-password" style={s.link}>Mot de passe oublié ?</Link>
          {' · '}
          <Link to="/register" style={s.link}>Créer un compte</Link>
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
  links: { textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-secondary)', margin: '16px 0 0' },
  link: { color: 'var(--color-secondary)' },
}
