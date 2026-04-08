import { useNavigate } from 'react-router-dom'
import { useSession, signOut } from '../lib/auth.js'

export default function Home() {
  const navigate = useNavigate()
  const { data: session } = useSession()

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Blind Test</h1>
        <p style={styles.subtitle}>Organise et joue à des blind tests en ligne avec tes amis</p>
      </div>

      {session && (
        <p style={styles.greeting}>
          Bonjour, <strong style={{ color: 'var(--text-primary)' }}>{session.user.name}</strong>
          {' · '}
          <button
            onClick={() => signOut()}
            style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
          >
            Déconnexion
          </button>
        </p>
      )}

      <div style={styles.actions}>
        {session ? (
          <button onClick={() => navigate('/dashboard')} style={styles.btnPrimary}>
            Gérer mes blind tests
          </button>
        ) : (
          <button onClick={() => navigate('/login')} style={styles.btnPrimary}>
            Connexion MJ
          </button>
        )}
        <button onClick={() => navigate('/join')} style={styles.btnSecondary}>
          Rejoindre une partie
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: 32,
    gap: 24,
  },
  hero: { textAlign: 'center' },
  title: {
    fontSize: 'clamp(2.5rem, 8vw, 5rem)',
    fontWeight: 900,
    margin: '0 0 12px',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    margin: 0,
    maxWidth: 320,
  },
  greeting: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: 0,
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 320,
  },
  btnPrimary: {
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
  },
  btnSecondary: {
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-md)',
  },
}
