import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { socket } from '../socket/socket.js'
import { EVENTS } from '../socket/events.js'
import { useSession } from '../lib/auth.js'
import { TEAM_COLORS } from '../styles/theme.js'

import { API } from '../config.js'

export default function HostLobby() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { data: sessionData } = useSession()

  const [players, setPlayers] = useState([])
  const [room, setRoom] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/rooms/${roomCode}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setRoom(data) })
      .catch(() => {})
  }, [roomCode])

  useEffect(() => {
    const token = sessionData?.session?.token
    if (!token) return

    socket.auth = { token }
    socket.connect()
    socket.emit(EVENTS.JOIN_ROOM, { roomCode })

    socket.on(EVENTS.PLAYER_JOINED, (data) => {
      if (!data.playerId) return
      setPlayers((prev) => {
        if (prev.find((p) => p.playerId === data.playerId)) return prev
        return [...prev, data]
      })
    })

    socket.on(EVENTS.PLAYER_LEFT, (data) => {
      setPlayers((prev) => prev.filter((p) => p.socketId !== data.socketId))
    })

    return () => {
      socket.off(EVENTS.PLAYER_JOINED)
      socket.off(EVENTS.PLAYER_LEFT)
      socket.disconnect()
    }
  }, [roomCode, sessionData?.session?.token])

  const joinUrl = `${window.location.origin}/join?code=${roomCode}`
  const isTeamMode = room?.isTeamMode

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins mon Blind Test !',
          text: `Code de la partie : ${roomCode}`,
          url: joinUrl,
        })
      } catch { /* annulé par l'utilisateur */ }
    } else {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const getTeamName = (teamId) => room?.teams?.find((t) => t.id === teamId)?.name ?? null
  const getTeamColor = (teamId) => {
    const idx = room?.teams?.findIndex((t) => t.id === teamId) ?? -1
    return idx >= 0 ? TEAM_COLORS[idx % TEAM_COLORS.length] : 'var(--text-muted)'
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>
          Lobby — En attente des joueurs
        </h1>
        <button
          onClick={() => navigate(`/host/${roomCode}/control`)}
          style={styles.startBtn}
          disabled={players.length === 0}
        >
          Lancer la partie ▶
        </button>
      </div>

      {/* QR Code + code room */}
      <div style={styles.codeCard}>
        <p style={styles.codeLabel}>Scanne pour rejoindre</p>
        <QRCodeSVG value={joinUrl} size={180} bgColor="transparent" fgColor="#f8fafc" />
        <p style={styles.codeLabel}>Code de la partie</p>
        <p style={styles.codeValue}>{roomCode.split('').join(' ')}</p>

        <button onClick={handleShare} style={styles.shareBtn}>
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Lien copié !
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Partager le lien
            </>
          )}
        </button>
      </div>

      {isTeamMode && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
          Mode équipes · {room.teams?.length} équipes
        </p>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Joueurs connectés
          <span style={styles.badge}>{players.length}</span>
        </h2>

        {players.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            En attente… Les joueurs rejoignent via <strong style={{ color: 'var(--color-secondary)' }}>/join</strong>
          </p>
        ) : (
          <ul style={styles.playerList}>
            {players.map((p) => {
              const teamName = isTeamMode ? getTeamName(p.teamId) : null
              const teamColor = isTeamMode ? getTeamColor(p.teamId) : 'var(--color-success)'
              return (
                <li key={p.playerId ?? p.socketId} style={styles.playerItem}>
                  <span style={{ ...styles.playerDot, background: teamColor }} />
                  <span style={{ fontWeight: 600 }}>{p.playerName}</span>
                  {teamName && (
                    <span style={{ ...styles.teamTag, borderColor: teamColor, color: teamColor }}>
                      {teamName}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: 24,
    maxWidth: 640,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startBtn: {
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 20px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
  },
  codeCard: {
    background: 'var(--bg-surface)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-lg)',
    padding: '28px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  codeLabel: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeValue: {
    margin: 0,
    fontSize: '2.8rem',
    fontWeight: 900,
    letterSpacing: '0.3em',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
  },
  shareBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
    transition: 'opacity 0.15s',
  },
  section: {
    background: 'var(--bg-surface)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-md)',
    padding: 16,
  },
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: 15,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-primary)',
  },
  badge: {
    background: 'var(--color-primary)',
    color: '#fff',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 13,
    fontWeight: 700,
  },
  playerList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  playerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
  },
  playerDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  teamTag: {
    marginLeft: 'auto',
    fontSize: 12,
    background: 'transparent',
    border: '1px solid',
    borderRadius: 4,
    padding: '2px 8px',
    fontWeight: 600,
  },
}
