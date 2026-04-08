import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { API } from '../../config.js'

export default function BlindTestEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [name, setName] = useState('')
  const [tracks, setTracks] = useState([])
  const [playlistId, setPlaylistId] = useState(id ?? null)
  const [form, setForm] = useState({ youtubeUrl: '', title: '', artist: '' })
  const [formError, setFormError] = useState(null)
  const [nameError, setNameError] = useState(null)

  useEffect(() => {
    if (!id) return
    fetch(`${API}/api/playlists/${id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setName(data.name)
        setTracks(data.tracks)
        setPlaylistId(data.id)
      })
      .catch(() => {})
  }, [id])

  const handleSaveName = async () => {
    setNameError(null)
    if (!name.trim()) return setNameError('Nom requis')
    if (isNew) {
      const res = await fetch(`${API}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const playlist = await res.json()
        setPlaylistId(playlist.id)
        navigate(`/dashboard/${playlist.id}/edit`, { replace: true })
      } else {
        const { error } = await res.json()
        setNameError(error)
      }
    } else {
      const res = await fetch(`${API}/api/playlists/${playlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setNameError(error)
      }
    }
  }

  const handleAddTrack = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!playlistId) return setFormError("Sauvegardez d'abord le nom du blind test")
    const res = await fetch(`${API}/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const track = await res.json()
      setTracks([...tracks, track])
      setForm({ youtubeUrl: '', title: '', artist: '' })
    } else {
      const { error } = await res.json()
      setFormError(error)
    }
  }

  const handleDeleteTrack = async (trackId) => {
    await fetch(`${API}/api/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setTracks(tracks.filter((t) => t.id !== trackId))
  }

  return (
    <div style={s.page}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 }}
      >
        ← Retour au dashboard
      </button>
      <h1 style={{ marginTop: 0, fontSize: 22, fontWeight: 800, marginBottom: 20 }}>
        {isNew ? 'Nouveau blind test' : 'Modifier le blind test'}
      </h1>

      {/* Nom */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 28 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du blind test"
          style={{ ...s.input, flex: 1, fontSize: 16 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
        />
        <button onClick={handleSaveName} style={s.btnPrimary}>
          {isNew && !playlistId ? 'Créer' : 'Renommer'}
        </button>
        {nameError && <span style={{ color: 'var(--color-danger)', fontSize: 13 }}>{nameError}</span>}
      </div>

      {/* Musiques */}
      {playlistId && (
        <>
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Musiques ({tracks.length})
          </h2>

          {tracks.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Aucune musique. Ajoutez-en une ci-dessous.
            </p>
          )}

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {tracks.map((track, i) => (
              <li key={track.id} style={s.trackItem}>
                <img
                  src={`https://img.youtube.com/vi/${track.youtubeId}/default.jpg`}
                  alt=""
                  width={60}
                  height={45}
                  style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                />
                <span style={{ flex: 1, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{i + 1}.</span>
                  <strong>{track.title}</strong>
                  {track.artist && <span style={{ color: 'var(--text-secondary)' }}> — {track.artist}</span>}
                </span>
                <button
                  onClick={() => handleDeleteTrack(track.id)}
                  style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {/* Formulaire ajout */}
          <form onSubmit={handleAddTrack} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <input
              placeholder="URL YouTube"
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              required
              style={{ ...s.input, flex: '2 1 200px' }}
            />
            <input
              placeholder="Titre"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              style={{ ...s.input, flex: '1 1 130px' }}
            />
            <input
              placeholder="Artiste (optionnel)"
              value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
              style={{ ...s.input, flex: '1 1 130px' }}
            />
            <button type="submit" style={s.btnPrimary}>Ajouter</button>
            {formError && <span style={{ color: 'var(--color-danger)', width: '100%', fontSize: 13 }}>{formError}</span>}
          </form>
        </>
      )}
    </div>
  )
}

const s = {
  page: {
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: 24,
    maxWidth: 720,
    margin: '0 auto',
  },
  input: {
    padding: '9px 12px',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  btnPrimary: {
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 16px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  trackItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--bg-surface)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
  },
}
