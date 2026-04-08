import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { API } from '../../config.js'

export default function PlaylistEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [name, setName] = useState('')
  const [tracks, setTracks] = useState([])
  const [playlistId, setPlaylistId] = useState(id ?? null)
  const [form, setForm] = useState({ youtubeUrl: '', title: '', artist: '' })
  const [formError, setFormError] = useState(null)
  const [nameError, setNameError] = useState(null)

  // Chargement en mode édition
  useEffect(() => {
    if (!id) return
    fetch(`${API}/api/playlists/${id}`)
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
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const playlist = await res.json()
        setPlaylistId(playlist.id)
        navigate(`/playlists/${playlist.id}/edit`, { replace: true })
      } else {
        const { error } = await res.json()
        setNameError(error)
      }
    } else {
      const res = await fetch(`${API}/api/playlists/${playlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
    if (!playlistId) return setFormError('Sauvegardez d\'abord le nom de la playlist')

    const res = await fetch(`${API}/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    await fetch(`${API}/api/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' })
    setTracks(tracks.filter((t) => t.id !== trackId))
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 700 }}>
      <button onClick={() => navigate('/playlists')} style={{ marginBottom: 16 }}>← Retour</button>
      <h1>{isNew ? 'Nouvelle playlist' : 'Éditer la playlist'}</h1>

      {/* Nom */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la playlist"
          style={{ flex: 1, padding: '6px 10px', fontSize: 16 }}
        />
        <button onClick={handleSaveName}>
          {isNew && !playlistId ? 'Créer' : 'Renommer'}
        </button>
        {nameError && <span style={{ color: '#dc2626' }}>{nameError}</span>}
      </div>

      {/* Tracks */}
      {playlistId && (
        <>
          <h2>Titres ({tracks.length})</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tracks.map((track, i) => (
              <li
                key={track.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #eee', borderRadius: 6, padding: '6px 10px' }}
              >
                <img
                  src={`https://img.youtube.com/vi/${track.youtubeId}/default.jpg`}
                  alt=""
                  width={60}
                  height={45}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
                <span style={{ flex: 1 }}>
                  {i + 1}. <strong>{track.title}</strong>
                  {track.artist && <span style={{ color: '#666' }}> — {track.artist}</span>}
                </span>
                <button onClick={() => handleDeleteTrack(track.id)} style={{ color: '#dc2626' }}>✕</button>
              </li>
            ))}
          </ul>

          {tracks.length === 0 && <p style={{ color: '#888' }}>Aucun titre. Ajoutez-en un ci-dessous.</p>}

          {/* Formulaire ajout */}
          <form onSubmit={handleAddTrack} style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="URL YouTube"
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              required
              style={{ flex: '2 1 220px' }}
            />
            <input
              placeholder="Titre"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              style={{ flex: '1 1 140px' }}
            />
            <input
              placeholder="Artiste (optionnel)"
              value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
              style={{ flex: '1 1 140px' }}
            />
            <button type="submit">Ajouter</button>
            {formError && <span style={{ color: '#dc2626', width: '100%' }}>{formError}</span>}
          </form>
        </>
      )}
    </div>
  )
}
