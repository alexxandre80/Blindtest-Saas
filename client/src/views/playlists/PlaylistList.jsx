import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { API } from '../../config.js'

const modalStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
}
const cardStyle = {
  background: '#fff', borderRadius: 8, padding: 24, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12,
}

export default function PlaylistList() {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState([])
  const [modal, setModal] = useState(null) // { playlistId }
  const [config, setConfig] = useState({ isTeamMode: false, extractDuration: 15 })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/playlists`)
      .then((r) => r.json())
      .then(setPlaylists)
      .catch(() => {})
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette playlist ?')) return
    await fetch(`${API}/api/playlists/${id}`, { method: 'DELETE' })
    setPlaylists(playlists.filter((p) => p.id !== id))
  }

  const handleCreateRoom = async () => {
    setError(null)
    setLoading(true)
    const res = await fetch(`${API}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 700 }}>
      <h1>Mes playlists</h1>
      <button onClick={() => navigate('/playlists/new')}>+ Nouvelle playlist</button>

      {playlists.length === 0 && <p style={{ marginTop: 16, color: '#888' }}>Aucune playlist. Créez-en une !</p>}

      <ul style={{ listStyle: 'none', padding: 0, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {playlists.map((p) => (
          <li
            key={p.id}
            style={{ border: '1px solid #ddd', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <div style={{ flex: 1 }}>
              <strong>{p.name}</strong>
              <span style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>
                {p._count.tracks} titre{p._count.tracks !== 1 ? 's' : ''}
              </span>
              <span style={{ color: '#aaa', marginLeft: 8, fontSize: 12 }}>
                {new Date(p.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <button onClick={() => navigate(`/playlists/${p.id}/edit`)}>Éditer</button>
            <button
              onClick={() => setModal({ playlistId: p.id })}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}
            >
              Lancer une partie
            </button>
            <button onClick={() => handleDelete(p.id)} style={{ color: '#dc2626' }}>✕</button>
          </li>
        ))}
      </ul>

      {/* Modale config partie */}
      {modal && (
        <div style={modalStyle} onClick={() => setModal(null)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>Configurer la partie</h2>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              Mode
              <select disabled value="oral">
                <option value="oral">Oral (actif)</option>
                <option value="written">Écrit (bientôt)</option>
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={config.isTeamMode}
                onChange={(e) => setConfig({ ...config, isTeamMode: e.target.checked })}
              />
              Mode équipes
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              Durée de l'extrait (s)
              <input
                type="number"
                value={config.extractDuration}
                min={5}
                max={120}
                onChange={(e) => setConfig({ ...config, extractDuration: Number(e.target.value) })}
                style={{ width: 80 }}
              />
            </label>

            {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)}>Annuler</button>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}
              >
                {loading ? '…' : 'Créer la partie'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
