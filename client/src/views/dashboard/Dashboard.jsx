import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/auth.js'
import Navbar from '../../components/Navbar/Navbar.jsx'

import { API } from '../../config.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const user = session?.user

  const [blindtests, setBlindtests] = useState([])
  const [modal, setModal] = useState(null)
  const [config, setConfig] = useState({ isTeamMode: false, extractDuration: 15 })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/playlists`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setBlindtests)
      .catch(() => {})
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce blind test ?')) return
    await fetch(`${API}/api/playlists/${id}`, { method: 'DELETE', credentials: 'include' })
    setBlindtests(blindtests.filter((p) => p.id !== id))
  }

  const handleCreateRoom = async () => {
    setError(null)
    setLoading(true)
    const res = await fetch(`${API}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ playlistId: modal.playlistId, ...config }),
    })
    setLoading(false)
    if (res.ok) {
      const room = await res.json()
      navigate(`/host/${room.code}/lobby`)
    } else {
      const { error } = await res.json()
      setError(error)
    }
  }

  function relativeDate(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 30) return `Il y a ${days} jours`
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  const firstName = user?.name?.split(' ')[0] ?? ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />

      <div style={s.page}>
        {/* ── Welcome ── */}
        <div style={s.welcome}>
          <div>
            <h1 style={s.welcomeTitle}>{greeting}, {firstName} 👋</h1>
            <p style={s.welcomeSub}>Prêt à animer un blind test ?</p>
          </div>
          <button onClick={() => navigate('/dashboard/new')} style={s.btnPrimary}>
            + Nouveau blind test
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={s.statsRow}>
          <StatCard
            value={blindtests.length}
            label="Blind test{s} créé{s}"
            plural={blindtests.length !== 1}
            color="var(--color-primary)"
            icon={<MusicIcon />}
          />
          <StatCard
            value={blindtests.reduce((acc, p) => acc + (p._count?.tracks ?? 0), 0)}
            label="Musique{s} au total"
            plural
            color="var(--color-secondary)"
            icon={<NoteIcon />}
          />
        </div>

        {/* ── Liste blind tests ── */}
        <section>
          <h2 style={s.sectionTitle}>Mes blind tests</h2>

          {blindtests.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🎵</div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 17 }}>Aucun blind test pour l'instant</p>
              <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                Créez votre premier blind test et commencez à jouer !
              </p>
              <button onClick={() => navigate('/dashboard/new')} style={s.btnPrimary}>
                Créer mon premier blind test
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {blindtests.map((p) => (
                <div key={p.id} style={s.card}>
                  <div style={s.cardIcon}>
                    <MusicIcon size={20} color="var(--color-primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                      {p._count.tracks} musique{p._count.tracks !== 1 ? 's' : ''}
                      {' · '}
                      {relativeDate(p.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => navigate(`/dashboard/${p.id}/edit`)} style={s.btnGhost} title="Modifier">
                      ✎ Modifier
                    </button>
                    <button onClick={() => setModal({ playlistId: p.id })} style={s.btnPrimary} title="Lancer une partie">
                      ▶ Lancer
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={s.btnDelete} title="Supprimer">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Modale config ── */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>Configurer la partie</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              Choisissez le mode de jeu et la durée des extraits.
            </p>

            {/* Mode équipes */}
            <div style={s.toggleRow} onClick={() => setConfig({ ...config, isTeamMode: !config.isTeamMode })}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Mode équipes</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Les joueurs se regroupent en équipes</p>
              </div>
              <div style={{ ...s.toggle, background: config.isTeamMode ? 'var(--color-primary)' : '#2d2d4e' }}>
                <div style={{ ...s.toggleKnob, transform: config.isTeamMode ? 'translateX(20px)' : 'translateX(0)' }} />
              </div>
            </div>

            {/* Durée */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Durée de l'extrait</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-primary)' }}>{config.extractDuration}s</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={config.extractDuration}
                onChange={(e) => setConfig({ ...config, extractDuration: Number(e.target.value) })}
                style={{ accentColor: 'var(--color-primary)', width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>10s</span><span>60s</span>
              </div>
            </label>

            {error && <p style={{ color: 'var(--color-danger)', margin: '12px 0 0', fontSize: 14 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={s.btnGhost}>Annuler</button>
              <button onClick={handleCreateRoom} disabled={loading} style={s.btnPrimary}>
                {loading ? '…' : '▶ Créer la partie'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Composants locaux ── */

function StatCard({ value, label, plural, color, icon }) {
  const text = label.replace(/{s}/g, plural ? 's' : '')
  return (
    <div style={{ ...s.statCard, borderColor: color }}>
      <div style={{ ...s.statIcon, background: `${color}20`, color }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color }}>{value}</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{text}</p>
      </div>
    </div>
  )
}

function MusicIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function NoteIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
    </svg>
  )
}

/* ── Styles ── */
const s = {
  page: { maxWidth: 720, margin: '0 auto', padding: '28px 24px 48px' },
  welcome: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  welcomeTitle: { margin: 0, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800 },
  welcomeSub: { margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'var(--bg-surface)',
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: { margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '52px 24px',
    background: 'var(--bg-surface)',
    border: '1px dashed #2d2d4e',
    borderRadius: 'var(--radius-lg)',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--bg-surface)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    transition: 'border-color 0.15s',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(124,58,237,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnPrimary: {
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 10px rgba(124,58,237,0.3)',
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid #2d2d4e',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnDelete: {
    border: 'none',
    background: 'none',
    color: 'var(--color-danger)',
    cursor: 'pointer',
    fontSize: 16,
    padding: '4px 8px',
    lineHeight: 1,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 16,
  },
  modal: {
    background: 'var(--bg-surface)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    cursor: 'pointer',
    userSelect: 'none',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  toggleKnob: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.2s',
  },
}
