import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { socket } from '../socket/socket.js'
import { EVENTS } from '../socket/events.js'
import { useGameStore } from '../store/gameStore.js'
import { useSound } from '../hooks/useSound.js'
import { useSession } from '../lib/auth.js'
import { TEAM_COLORS } from '../styles/theme.js'

import { API } from '../config.js'

export default function HostControl() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { play } = useSound()
  const { data: sessionData } = useSession()

  const {
    playlist, setPlaylist,
    currentTrackIndex, setCurrentTrackIndex,
    setCurrentYoutubeId,
    timer, setTimer,
    setLastSocketEvent,
    buzzerQueue, addToBuzzerQueue, removeBuzzFromQueue, clearBuzzerQueue,
    scores, setScores,
    roundAnswer, setRoundAnswer,
    teams, setTeams,
  } = useGameStore()

  const [timerDuration, setTimerDuration] = useState(15)

  useEffect(() => {
    fetch(`${API}/api/rooms/${roomCode}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((room) => {
        if (room?.playlist?.tracks) setPlaylist(room.playlist.tracks)
        if (room?.teams) setTeams(room.teams)
        if (room?.extractDuration) setTimerDuration(room.extractDuration)
      })
      .catch(() => {})
  }, [roomCode])

  useEffect(() => {
    const token = sessionData?.session?.token
    if (!token) return

    socket.auth = { token }
    socket.connect()
    socket.emit(EVENTS.JOIN_ROOM, { roomCode })

    socket.on(EVENTS.TRACK_STARTED, (data) => {
      setLastSocketEvent(EVENTS.TRACK_STARTED, data)
      setCurrentTrackIndex(data.trackIndex)
      setCurrentYoutubeId(data.youtubeId)
      clearBuzzerQueue()
      setRoundAnswer(null)
      setTimer({ remaining: timerDuration, isRunning: false })
    })

    socket.on(EVENTS.TIMER_TICK, (data) => {
      setLastSocketEvent(EVENTS.TIMER_TICK, data)
      setTimer({ remaining: data.remaining, duration: data.duration, isRunning: true })
    })

    socket.on(EVENTS.TIMER_END, () => {
      setLastSocketEvent(EVENTS.TIMER_END, {})
      setTimer({ remaining: 0, isRunning: false })
    })

    socket.on(EVENTS.BUZZ_RECEIVED, (data) => {
      setLastSocketEvent(EVENTS.BUZZ_RECEIVED, data)
      addToBuzzerQueue(data)
    })

    socket.on(EVENTS.BUZZ_DENIED, (data) => {
      removeBuzzFromQueue(data.buzzId)
    })

    socket.on(EVENTS.SCORES_UPDATED, (data) => {
      setLastSocketEvent(EVENTS.SCORES_UPDATED, data)
      setScores(data)
      play('point')
    })

    socket.on(EVENTS.ROUND_ENDED, (data) => {
      setLastSocketEvent(EVENTS.ROUND_ENDED, data)
      setRoundAnswer(data.answer)
      clearBuzzerQueue()
    })

    socket.on(EVENTS.GAME_ENDED, (data) => {
      setLastSocketEvent(EVENTS.GAME_ENDED, data)
    })

    return () => {
      socket.off(EVENTS.TRACK_STARTED)
      socket.off(EVENTS.TIMER_TICK)
      socket.off(EVENTS.TIMER_END)
      socket.off(EVENTS.BUZZ_RECEIVED)
      socket.off(EVENTS.BUZZ_DENIED)
      socket.off(EVENTS.SCORES_UPDATED)
      socket.off(EVENTS.ROUND_ENDED)
      socket.off(EVENTS.GAME_ENDED)
      socket.disconnect()
    }
  }, [roomCode, sessionData?.session?.token])

  const handleNextTrack = () => socket.emit(EVENTS.NEXT_TRACK, { roomCode })

  const handleStopGame = () => {
    if (!window.confirm('Arrêter la partie ? Les scores seront conservés.')) return
    socket.emit(EVENTS.STOP_GAME, { roomCode })
  }

  const handleQuit = () => {
    if (!window.confirm('Quitter la régie ? La partie sera arrêtée.')) return
    socket.emit(EVENTS.STOP_GAME, { roomCode })
    navigate('/dashboard')
  }

  const handleTimerPause = () => {
    socket.emit(EVENTS.TIMER_PAUSE, { roomCode })
    setTimer({ isRunning: false })
  }

  const handleTimerReset = () => {
    socket.emit(EVENTS.TIMER_RESET, { roomCode })
    setTimer({ remaining: timerDuration, isRunning: false })
  }

  const handleGrantPoint = (buzz) => {
    socket.emit(EVENTS.GRANT_POINT, { roomCode, buzzId: buzz.buzzId, roundId: buzz.roundId })
  }

  const handleDenyPoint = (buzz) => {
    socket.emit(EVENTS.DENY_POINT, { roomCode, buzzId: buzz.buzzId })
    play('wrong')
  }

  const getTeamColor = (teamId) => {
    const idx = teams.findIndex((t) => t.id === teamId)
    return idx >= 0 ? TEAM_COLORS[idx % TEAM_COLORS.length] : '#6b7280'
  }

  const { remaining, duration } = timer
  const pct = duration > 0 ? Math.max(0, (remaining / duration) * 100) : 100
  const timerColor = pct > 50 ? 'var(--timer-green)' : pct > 20 ? 'var(--timer-orange)' : 'var(--timer-red)'

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Régie — {roomCode}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.open(`/host/${roomCode}/display`, '_blank')}
            style={s.btnGhost}
          >
            Display ↗
          </button>
          <button onClick={handleStopGame} style={{ ...s.btn, background: 'var(--color-danger)' }}>
            Arrêter
          </button>
          <button onClick={handleQuit} style={s.btnGhost}>
            Quitter
          </button>
        </div>
      </div>

      <div style={s.grid}>
        {/* ── Gauche ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Playlist */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Blind test</h2>
            {playlist.length === 0 && <p style={s.muted}>Aucune musique.</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {playlist.map((track, i) => (
                <li
                  key={track.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontWeight: i === currentTrackIndex ? 700 : 400,
                    background: i === currentTrackIndex ? 'rgba(124,58,237,0.15)' : 'transparent',
                    borderLeft: i === currentTrackIndex ? '3px solid var(--color-primary)' : '3px solid transparent',
                    fontSize: 13,
                  }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${track.youtubeId}/default.jpg`}
                    alt=""
                    width={48}
                    height={36}
                    style={{ borderRadius: 4, flexShrink: 0 }}
                  />
                  <span style={{ color: i === currentTrackIndex ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {i + 1}. {track.title}{track.artist ? ` — ${track.artist}` : ''}
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={handleNextTrack} style={{ ...s.btn, marginTop: 8 }}>
              Musique suivante ▶
            </button>
          </section>

          {/* Timer */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Timer</h2>
            <div style={{ background: '#2a2a3a', borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${pct}%`, background: timerColor, height: '100%', transition: 'width 1s linear, background 0.5s ease' }} />
            </div>
            <p style={{ fontSize: 36, fontWeight: 800, margin: '0 0 10px', color: remaining <= 3 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {remaining}s
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleTimerPause} style={s.btnGhost}>Pause</button>
              <button onClick={handleTimerReset} style={s.btnGhost}>Reset</button>
            </div>
          </section>
        </div>

        {/* ── Droite ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Buzzers */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Buzzers</h2>

            {roundAnswer && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--color-success)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-success)', fontSize: 14 }}>
                  ✓ {roundAnswer.title}{roundAnswer.artist ? ` — ${roundAnswer.artist}` : ''}
                </p>
              </div>
            )}

            {buzzerQueue.length === 0 && !roundAnswer && (
              <p style={s.muted}>En attente de buzz…</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {buzzerQueue.map((buzz, i) => {
                const color = buzz.teamId ? getTeamColor(buzz.teamId) : '#6b7280'
                return (
                  <div
                    key={buzz.buzzId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      border: `2px solid ${color}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      background: `${color}18`,
                    }}
                  >
                    <span style={{ fontWeight: 800, color, minWidth: 22, fontSize: 15 }}>#{buzz.order}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{buzz.playerName}</p>
                      {buzz.teamName && <p style={{ margin: 0, fontSize: 12, color }}>{buzz.teamName}</p>}
                    </div>
                    {i === 0 && !roundAnswer && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleGrantPoint(buzz)}
                          style={{ background: 'var(--color-success)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                        >
                          ✓ Correct
                        </button>
                        <button
                          onClick={() => handleDenyPoint(buzz)}
                          style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                        >
                          ✗ Faux
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Scores */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Scores</h2>
            {scores.teams?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...scores.teams].sort((a, b) => b.score - a.score).map((team, i) => (
                  <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 6, background: 'var(--bg-card)', borderLeft: `3px solid ${TEAM_COLORS[i % TEAM_COLORS.length]}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: TEAM_COLORS[i % TEAM_COLORS.length], display: 'inline-block' }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{team.name}</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 18, color: TEAM_COLORS[i % TEAM_COLORS.length] }}>{team.score}</span>
                  </div>
                ))}
              </div>
            ) : scores.players?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...scores.players].sort((a, b) => b.score - a.score).map((player) => (
                  <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--bg-card)' }}>
                    <span style={{ fontSize: 14 }}>{player.name}</span>
                    <span style={{ fontWeight: 700 }}>{player.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={s.muted}>Aucun score pour l'instant.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: 16,
    maxWidth: 920,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  section: {
    background: 'var(--bg-surface)',
    border: '1px solid #2d2d4e',
    borderRadius: 'var(--radius-md)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  muted: { color: 'var(--text-muted)', fontSize: 13, margin: 0 },
  btn: {
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 14px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid #2d2d4e',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 13,
  },
}
