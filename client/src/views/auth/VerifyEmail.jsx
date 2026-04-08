import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authClient } from '../../lib/auth.js'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('pending') // pending | success | error
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!token) return setStatus('error')
    authClient.verifyEmail({ query: { token } })
      .then(({ error }) => {
        if (error) { setMessage(error.message); setStatus('error') }
        else setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div style={s.page}>
      <div style={s.card}>
        {status === 'pending' && <p style={{ color: 'var(--text-secondary)' }}>Vérification en cours…</p>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <h2 style={{ margin: '0 0 8px' }}>Email confirmé !</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>Ton compte est activé.</p>
            <Link to="/login" style={s.linkBtn}>Se connecter</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 style={{ margin: '0 0 8px' }}>Lien invalide ou expiré</h2>
            <p style={{ color: 'var(--color-danger)', margin: '0 0 16px' }}>
              {message || "Ce lien de vérification n'est plus valide."}
            </p>
            <Link to="/login" style={s.link}>Retour à la connexion</Link>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", padding: 16 },
  card: { background: 'var(--bg-surface)', border: '1px solid #2d2d4e', borderRadius: 'var(--radius-lg)', padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' },
  linkBtn: { display: 'inline-block', padding: '10px 24px', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600 },
  link: { color: 'var(--color-secondary)' },
}
