import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession, signOut, authClient } from '../../lib/auth.js'

/* ── Avatar ── */
function Avatar({ user, size = 38 }) {
  const [imgError, setImgError] = useState(false)

  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  const bg = COLORS[(user?.name?.charCodeAt(0) ?? 0) % COLORS.length]

  if (user?.image && !imgError) {
    return (
      <img
        src={user.image}
        alt={user.name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bg}, ${bg}aa)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size * 0.36,
        color: '#fff',
        letterSpacing: 0.5,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

/* ── Navbar ── */
export default function Navbar() {
  const navigate = useNavigate()
  const { data: session, refetch } = useSession()
  const user = session?.user

  const [open, setOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const dropRef = useRef(null)

  // Fermer le dropdown en cliquant ailleurs
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSavePhoto = async () => {
    if (!photoUrl.trim()) return
    setSaving(true)
    await authClient.updateUser({ image: photoUrl.trim() })
    setSaving(false)
    setEditingPhoto(false)
    setPhotoUrl('')
    refetch?.()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={s.nav}>
      {/* Logo */}
      <button
        onClick={() => navigate('/dashboard')}
        style={s.logo}
      >
        Blind Test
      </button>

      {/* Droite : avatar + dropdown */}
      {user && (
        <div style={{ position: 'relative' }} ref={dropRef}>
          <button
            onClick={() => { setOpen((v) => !v); setEditingPhoto(false) }}
            style={s.avatarBtn}
            title={user.name}
          >
            <Avatar user={user} size={36} />
            <span style={s.userName}>{user.name}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div style={s.dropdown}>
              {/* Infos user */}
              <div style={s.dropHeader}>
                <Avatar user={user} size={48} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </p>
                </div>
              </div>

              <div style={s.divider} />

              {/* Changer la photo */}
              {!editingPhoto ? (
                <button
                  style={s.dropItem}
                  onClick={() => setEditingPhoto(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Changer la photo
                </button>
              ) : (
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    autoFocus
                    placeholder="URL de l'image…"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePhoto()}
                    style={s.photoInput}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleSavePhoto} disabled={saving || !photoUrl.trim()} style={s.photoBtnSave}>
                      {saving ? '…' : 'Enregistrer'}
                    </button>
                    <button onClick={() => { setEditingPhoto(false); setPhotoUrl('') }} style={s.photoBtnCancel}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div style={s.divider} />

              {/* Déconnexion */}
              <button style={{ ...s.dropItem, color: 'var(--color-danger)' }} onClick={handleSignOut}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

const s = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid #2d2d4e',
    background: 'var(--bg-surface)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  logo: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 900,
    fontSize: 18,
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  avatarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--bg-card)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-lg)',
    padding: '4px 12px 4px 4px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    maxWidth: 140,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: 'var(--bg-surface)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-md)',
    minWidth: 240,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    overflow: 'hidden',
    zIndex: 100,
  },
  dropHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
  },
  divider: {
    height: 1,
    background: '#2d2d4e',
  },
  dropItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
    fontFamily: "'Inter', system-ui, sans-serif",
    textAlign: 'left',
  },
  photoInput: {
    padding: '7px 10px',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  photoBtnSave: {
    flex: 1,
    padding: '6px 0',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  photoBtnCancel: {
    flex: 1,
    padding: '6px 0',
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    cursor: 'pointer',
  },
}
